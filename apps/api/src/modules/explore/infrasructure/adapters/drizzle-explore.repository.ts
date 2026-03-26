import { Inject, Injectable } from '@nestjs/common';
import { ExploreRepository } from '../../core/ports/explore.repository';
import { DB } from 'src/modules/db/client';

import { branches } from 'src/modules/db/schema/branches';
import { branchImages } from 'src/modules/db/schema/branches';
import { publicBookingRatings } from 'src/modules/db/schema';
import { services } from 'src/modules/db/schema/services';
import { serviceCategories } from 'src/modules/db/schema/services/serviceCategories';

import { eq, sql, and, lte, asc } from 'drizzle-orm';
import { ExploreFilters } from '../../core/entities/explore-branch.entity';

@Injectable()
export class DrizzleExploreRepository implements ExploreRepository {
  constructor(@Inject('DB') private db: DB) {}

  async findExploreBranches(filters: ExploreFilters = {}) {
    const { lat, lng, radius, sort } = filters;

    // =========================
    // PARSEO
    // =========================
    const categoryList = filters.categories
      ? filters.categories.split(',').map((c) => c.trim())
      : [];

    const hasCategories = categoryList.length > 0;

    const hasLocation = typeof lat === 'number' && typeof lng === 'number';

    // =========================
    // DISTANCE SQL
    // =========================
    const distanceSql = hasLocation
      ? sql<number>`
          6371 * acos(
            cos(radians(${lat})) *
            cos(radians(CAST(${branches.lat} AS double precision))) *
            cos(
              radians(CAST(${branches.lng} AS double precision)) - radians(${lng})
            ) +
            sin(radians(${lat})) *
            sin(radians(CAST(${branches.lat} AS double precision)))
          )
        `
      : sql<number>`NULL`;

    // =========================
    // BASE QUERY
    // =========================
    const base = await this.db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        lat: branches.lat,
        lng: branches.lng,
        publicSlug: branches.publicSlug,
        distanceKm: distanceSql,
      })
      .from(branches)
      .where(
        and(
          eq(branches.publicPresenceEnabled, true),
          hasLocation && radius !== undefined
            ? lte(distanceSql, radius)
            : undefined,
        ),
      )
      .orderBy(
        hasLocation && sort === 'distance'
          ? asc(distanceSql)
          : asc(branches.name),
      );

    // =========================
    // RATINGS
    // =========================
    const ratings = await this.db
      .select({
        branchId: publicBookingRatings.branchId,
        avg: sql<number>`avg(${publicBookingRatings.rating})`,
        count: sql<number>`count(${publicBookingRatings.id})`,
      })
      .from(publicBookingRatings)
      .groupBy(publicBookingRatings.branchId);

    const ratingMap = new Map(ratings.map((r) => [r.branchId, r]));

    // =========================
    // COVER IMAGES
    // =========================
    const covers = await this.db
      .select({
        branchId: branchImages.branchId,
        url: branchImages.url,
      })
      .from(branchImages)
      .where(eq(branchImages.isCover, true));

    const coverMap = new Map(covers.map((c) => [c.branchId, c.url]));

    // =========================
    // SERVICES + CATEGORY JOIN
    // =========================
    const servicesData = await this.db
      .select({
        branchId: services.branchId,
        name: services.name,
        priceCents: services.priceCents,
        durationMin: services.durationMin,
        categorySlug: serviceCategories.slug,
        categoryName: serviceCategories.name,
      })
      .from(services)
      .leftJoin(
        serviceCategories,
        eq(services.categoryId, serviceCategories.id),
      )
      .where(eq(services.isActive, true));

    type ServiceRow = {
      branchId: string;
      name: string;
      priceCents: number | null;
      durationMin: number;
      categoryName: string | null;
      categorySlug: string | null;
    };

    const servicesMap = new Map<string, ServiceRow[]>();

    for (const s of servicesData) {
      if (!servicesMap.has(s.branchId)) {
        servicesMap.set(s.branchId, []);
      }
      servicesMap.get(s.branchId)!.push(s);
    }

    // =========================
    // MAP BASE RESULT
    // =========================
    let result = base.map((b) => {
      const rating = ratingMap.get(b.id);
      const servicesList = servicesMap.get(b.id) ?? [];

      const prices = servicesList
        .map((s) => s.priceCents ?? 0)
        .filter((p) => p > 0);

      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;

      return {
        id: b.id,
        name: b.name,
        address: b.address ?? undefined,
        lat: b.lat ? Number(b.lat) : undefined,
        lng: b.lng ? Number(b.lng) : undefined,
        publicSlug: b.publicSlug ?? undefined,
        coverImage: coverMap.get(b.id) ?? undefined,

        ratingAvg: Number(rating?.avg ?? 0),
        ratingCount: Number(rating?.count ?? 0),

        servicesCount: servicesList.length,

        servicesPreview: servicesList.slice(0, 3).map((s) => ({
          name: s.name,
          priceCents: s.priceCents ?? undefined,
          durationMin: s.durationMin,
          categoryName: s.categoryName ?? undefined,
          categorySlug: s.categorySlug ?? undefined,
        })),

        minPrice,
        maxPrice,

        distanceKm:
          b.distanceKm !== null && b.distanceKm !== undefined
            ? Number(b.distanceKm)
            : undefined,
      };
    });

    // =========================
    // FILTERS
    // =========================

    // ⭐ rating
    if (filters.rating !== undefined) {
      result = result.filter((b) => (b.ratingAvg ?? 0) >= filters.rating!);
    }

    // 💰 price
    if (filters.minPrice !== undefined) {
      result = result.filter((b) => b.minPrice >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      result = result.filter((b) => b.maxPrice <= filters.maxPrice!);
    }

    console.log({
      raw: filters.categories,
      parsed: categoryList,
      hasCategories,
    });

    // 🧩 categories (por NAME)
    if (hasCategories) {
      result = result.filter((b) => {
        const servicesList = servicesMap.get(b.id) ?? [];

        return servicesList.some(
          (s) => s.categorySlug && categoryList.includes(s.categorySlug),
        );
      });
    }

    // =========================
    // SORT
    // =========================
    if (sort === 'rating') {
      result.sort((a, b) => b.ratingAvg - a.ratingAvg);
    }

    if (sort === 'price') {
      result.sort((a, b) => a.minPrice - b.minPrice);
    }

    if (sort === 'distance') {
      result.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    return result;
  }
}
