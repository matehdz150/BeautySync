import { Inject, Injectable } from '@nestjs/common';
import { ExploreRepository } from '../../core/ports/explore.repository';
import { DB } from 'src/modules/db/client';
import { sql } from 'drizzle-orm';
import { ExploreFilters } from '../../core/entities/explore-branch.entity';
import { requestContext } from 'src/modules/metrics/request-context';

type ExploreBranchRow = {
  id: string;
  name: string;
  address: string | null;
  lat: string | number | null;
  lng: string | number | null;
  publicSlug: string | null;
  coverImage: string | null;
  ratingAvg: string | number | null;
  ratingCount: string | number | null;
  servicesCount: string | number | null;
  minPrice: string | number | null;
  maxPrice: string | number | null;
  distanceKm: string | number | null;
  servicesPreview: Array<{
    name: string;
    priceCents: number | null;
    durationMin: number;
    categoryName?: string | null;
    categorySlug?: string | null;
  }> | null;
};

type ExplorePreviewItem = {
  name: string;
  priceCents: number | null;
  durationMin: number;
  categoryName?: string | null;
  categorySlug?: string | null;
};

function toNumber(value: string | number | null | undefined, fallback = 0) {
  if (value === null || value === undefined) {
    return fallback;
  }

  return Number(value);
}

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T[];
    } catch {
      return [];
    }
  }

  return [];
}

@Injectable()
export class DrizzleExploreRepository implements ExploreRepository {
  constructor(@Inject('DB') private db: DB) {}

  async findExploreBranches(filters: ExploreFilters = {}) {
    const { lat, lng, radius, sort } = filters;
    const categoryList = filters.categories
      ? filters.categories
          .split(',')
          .map((category) => category.trim())
          .filter(Boolean)
      : [];
    const hasCategories = categoryList.length > 0;
    const hasLocation = typeof lat === 'number' && typeof lng === 'number';
    const requestKey = `explore:request:${JSON.stringify({
      ...filters,
      categories: categoryList,
    })}`;

    return requestContext.memo(requestKey, async () => {
      const distanceSql = hasLocation
        ? sql`
            6371 * acos(
              cos(radians(${lat!})) *
              cos(radians(CAST(b.lat AS double precision))) *
              cos(radians(CAST(b.lng AS double precision)) - radians(${lng!})) +
              sin(radians(${lat!})) *
              sin(radians(CAST(b.lat AS double precision)))
            )
          `
        : sql`NULL`;

      const categoryFilterSql = hasCategories
        ? sql`
            AND EXISTS (
              SELECT 1
              FROM services s
              LEFT JOIN service_categories sc ON sc.id = s.category_id
              WHERE s.branch_id = b.id
                AND s.is_active = true
                AND sc.slug IN (${sql.join(
                  categoryList.map((category) => sql`${category}`),
                  sql`, `,
                )})
            )
          `
        : sql``;

      const radiusFilterSql =
        hasLocation && radius !== undefined
          ? sql`AND ${distanceSql} <= ${radius}`
          : sql``;

      const minPriceFilterSql =
        filters.minPrice !== undefined
          ? sql`
              AND COALESCE((
                SELECT MIN(s.price_cents)
                FROM services s
                WHERE s.branch_id = b.id
                  AND s.is_active = true
                  AND s.price_cents > 0
              ), 0) >= ${filters.minPrice}
            `
          : sql``;

      const maxPriceFilterSql =
        filters.maxPrice !== undefined
          ? sql`
              AND COALESCE((
                SELECT MAX(s.price_cents)
                FROM services s
                WHERE s.branch_id = b.id
                  AND s.is_active = true
                  AND s.price_cents > 0
              ), 0) <= ${filters.maxPrice}
            `
          : sql``;

      const ratingFilterSql =
        filters.rating !== undefined
          ? sql`
              AND COALESCE((
                SELECT AVG(pbr.rating)::float
                FROM public_booking_ratings pbr
                WHERE pbr.branch_id = b.id
              ), 0) >= ${filters.rating}
            `
          : sql``;

      const orderBySql =
        sort === 'rating'
          ? sql`"ratingAvg" DESC, b.name ASC`
          : sort === 'price'
            ? sql`"minPrice" ASC, b.name ASC`
            : hasLocation && sort === 'distance'
              ? sql`"distanceKm" ASC NULLS LAST, b.name ASC`
              : sql`b.name ASC`;

      const result = await this.db.execute<ExploreBranchRow>(sql`
        SELECT
          b.id,
          b.name,
          b.address,
          b.lat,
          b.lng,
          b.public_slug as "publicSlug",
          (
            SELECT bi.url
            FROM branch_images bi
            WHERE bi.branch_id = b.id
            ORDER BY bi.is_cover DESC, bi.position ASC NULLS LAST, bi.created_at ASC
            LIMIT 1
          ) as "coverImage",
          COALESCE((
            SELECT AVG(pbr.rating)::float
            FROM public_booking_ratings pbr
            WHERE pbr.branch_id = b.id
          ), 0) as "ratingAvg",
          COALESCE((
            SELECT COUNT(*)::int
            FROM public_booking_ratings pbr
            WHERE pbr.branch_id = b.id
          ), 0) as "ratingCount",
          COALESCE((
            SELECT COUNT(*)::int
            FROM services s
            WHERE s.branch_id = b.id
              AND s.is_active = true
          ), 0) as "servicesCount",
          COALESCE((
            SELECT MIN(s.price_cents)
            FROM services s
            WHERE s.branch_id = b.id
              AND s.is_active = true
              AND s.price_cents > 0
          ), 0) as "minPrice",
          COALESCE((
            SELECT MAX(s.price_cents)
            FROM services s
            WHERE s.branch_id = b.id
              AND s.is_active = true
              AND s.price_cents > 0
          ), 0) as "maxPrice",
          ${distanceSql} as "distanceKm",
          COALESCE((
            SELECT json_agg(
              json_build_object(
                'name', preview.name,
                'priceCents', preview.price_cents,
                'durationMin', preview.duration_min,
                'categoryName', preview.category_name,
                'categorySlug', preview.category_slug
              )
              ORDER BY preview.name
            )
            FROM (
              SELECT
                s.name,
                s.price_cents,
                s.duration_min,
                sc.name as category_name,
                sc.slug as category_slug
              FROM services s
              LEFT JOIN service_categories sc ON sc.id = s.category_id
              WHERE s.branch_id = b.id
                AND s.is_active = true
              ORDER BY s.name ASC
              LIMIT 3
            ) preview
          ), '[]'::json) as "servicesPreview"
        FROM branches b
        WHERE b.public_presence_enabled = true
        ${radiusFilterSql}
        ${categoryFilterSql}
        ${minPriceFilterSql}
        ${maxPriceFilterSql}
        ${ratingFilterSql}
        ORDER BY ${orderBySql}
      `);

      return (result as unknown as ExploreBranchRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        address: row.address ?? undefined,
        lat: row.lat !== null ? Number(row.lat) : undefined,
        lng: row.lng !== null ? Number(row.lng) : undefined,
        publicSlug: row.publicSlug ?? undefined,
        coverImage: row.coverImage ?? undefined,
        ratingAvg: toNumber(row.ratingAvg),
        ratingCount: toNumber(row.ratingCount),
        servicesCount: toNumber(row.servicesCount),
        minPrice: toNumber(row.minPrice),
        maxPrice: toNumber(row.maxPrice),
        distanceKm:
          row.distanceKm !== null && row.distanceKm !== undefined
            ? Number(row.distanceKm)
            : undefined,
        servicesPreview: parseJsonArray<ExplorePreviewItem>(row.servicesPreview).map(
          (service) => ({
          name: service.name,
          priceCents: service.priceCents ?? undefined,
          durationMin: service.durationMin,
          categoryName: service.categoryName ?? undefined,
          categorySlug: service.categorySlug ?? undefined,
          }),
        ),
      }));
    });
  }
}
