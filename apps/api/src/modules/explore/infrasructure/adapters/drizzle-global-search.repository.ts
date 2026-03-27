import { Injectable } from '@nestjs/common';
import { GlobalSearchRepository } from '../../core/ports/global-search.repository';
import { db } from 'src/modules/db/client';
import { sql } from 'drizzle-orm';
import {
  BranchSearchItem,
  ServiceSearchItem,
  StaffSearchItem,
} from '../../core/entities/global-search.entity';

function rows<T>(result: any): T[] {
  return result as T[];
}

@Injectable()
export class DrizzleGlobalSearchRepository implements GlobalSearchRepository {
  // =========================
  // 🔥 RECOMMENDATIONS
  // =========================

  async getRecommendedBranches({
    limit,
    lat,
    lng,
  }: {
    limit: number;
    lat?: number;
    lng?: number;
  }) {
    const result = await db.execute(sql`
      SELECT DISTINCT ON (b.id)
        b.id,
        b.name,
        b.address,
        b.lat,
        b.lng,
        b.public_slug as "publicSlug",
        img.url as "coverImage",
        COALESCE(r.avg, 0) as "ratingAvg",

        ${
          lat && lng
            ? sql`ST_Distance(
                ST_MakePoint(${lng}, ${lat})::geography,
                ST_MakePoint(b.lng, b.lat)::geography
              )`
            : sql`0`
        } as distance

      FROM branches b

      LEFT JOIN branch_images img 
        ON img.branch_id = b.id AND img.is_cover = true

      LEFT JOIN (
        SELECT branch_id, AVG(rating) as avg
        FROM public_booking_ratings
        GROUP BY branch_id
      ) r ON r.branch_id = b.id

      WHERE b.public_presence_enabled = true

      ORDER BY 
        b.id,
        ${lat && lng ? sql`distance ASC,` : sql``}
        COALESCE(r.avg, 0) DESC

      LIMIT ${limit}
    `);

    return rows<BranchSearchItem>(result);
  }

  async getRecommendedServices(limit: number) {
    const result = await db.execute(sql`
      SELECT 
        s.id,
        s.name,
        s.duration_min as "durationMin",
        sc.icon,
        b.public_slug as "publicSlug"

      FROM services s
      LEFT JOIN service_categories sc ON sc.id = s.category_id
      LEFT JOIN branches b ON b.id = s.branch_id

      WHERE s.is_active = true

      ORDER BY s.created_at DESC
      LIMIT ${limit}
    `);

    return rows<ServiceSearchItem>(result);
  }

  async getRecommendedStaff(limit: number) {
    const result = await db.execute(sql`
      SELECT 
        s.id,
        s.name,
        s."jobRole" as role,
        s.avatar_url as "avatarUrl",
        b.public_slug as "publicSlug"

      FROM staff s
      LEFT JOIN branches b ON b.id = s.branch_id

      WHERE s.is_active = true

      ORDER BY s.created_at DESC
      LIMIT ${limit}
    `);

    return rows<StaffSearchItem>(result);
  }

  // =========================
  // 🔥 SEARCH (CON OFFSET)
  // =========================

  async searchBranches({
    query,
    limit,
    cursor,
  }: {
    query: string;
    limit: number;
    cursor?: { score: number; id: string };
    lat?: number;
    lng?: number;
  }) {
    const cursorCondition = cursor
      ? sql`AND (
        similarity(b.name, ${query}) < ${cursor.score}
        OR (
          similarity(b.name, ${query}) = ${cursor.score}
          AND b.id > ${cursor.id}
        )
      )`
      : sql``;

    const result = await db.execute(sql`
    SELECT
      b.id,
      b.name,
      b.address,
      b.lat,
      b.lng,
      b.public_slug as "publicSlug",
      img.url as "coverImage",
      COALESCE(r.avg, 0) as "ratingAvg",
      similarity(b.name, ${query}) as score

    FROM branches b

    LEFT JOIN branch_images img 
      ON img.branch_id = b.id AND img.is_cover = true

    LEFT JOIN (
      SELECT branch_id, AVG(rating) as avg
      FROM public_booking_ratings
      GROUP BY branch_id
    ) r ON r.branch_id = b.id

    WHERE 
      b.public_presence_enabled = true
      AND (
        b.name ILIKE ${'%' + query + '%'}
        OR similarity(b.name, ${query}) > 0.3
      )
      ${cursorCondition}

    ORDER BY score DESC, b.id ASC
    LIMIT ${limit + 1} -- 🔥 para saber si hay más
  `);

    const data = rows<BranchSearchItem & { score: number }>(result);

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;

    const nextCursor = hasMore
      ? Buffer.from(
          JSON.stringify({
            score: items[items.length - 1].score,
            id: items[items.length - 1].id,
          }),
        ).toString('base64')
      : null;

    return {
      items,
      nextCursor,
    };
  }

  async searchServices({
    query,
    limit,
    cursor,
  }: {
    query: string;
    limit: number;
    cursor?: { score: number; id: string };
  }) {
    const cursorCondition = cursor
      ? sql`AND (
        similarity(s.name, ${query}) < ${cursor.score}
        OR (
          similarity(s.name, ${query}) = ${cursor.score}
          AND s.id > ${cursor.id}
        )
      )`
      : sql``;

    const result = await db.execute(sql`
    SELECT 
      s.id,
      s.name,
      s.duration_min as "durationMin",
      sc.icon,
      b.public_slug as "publicSlug",
      similarity(s.name, ${query}) as score

    FROM services s
    LEFT JOIN service_categories sc ON sc.id = s.category_id
    LEFT JOIN branches b ON b.id = s.branch_id

    WHERE 
      s.is_active = true
      AND (
        s.name ILIKE ${'%' + query + '%'}
        OR similarity(s.name, ${query}) > 0.3
      )
      ${cursorCondition}

    ORDER BY score DESC, s.id ASC
    LIMIT ${limit + 1}
  `);

    const data = rows<ServiceSearchItem & { score: number }>(result);

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;

    const nextCursor = hasMore
      ? Buffer.from(
          JSON.stringify({
            score: items[items.length - 1].score,
            id: items[items.length - 1].id,
          }),
        ).toString('base64')
      : null;

    return { items, nextCursor };
  }

  async searchStaff({
    query,
    limit,
    cursor,
  }: {
    query: string;
    limit: number;
    cursor?: { score: number; id: string };
  }) {
    const cursorCondition = cursor
      ? sql`AND (
        similarity(s.name, ${query}) < ${cursor.score}
        OR (
          similarity(s.name, ${query}) = ${cursor.score}
          AND s.id > ${cursor.id}
        )
      )`
      : sql``;

    const result = await db.execute(sql`
    SELECT 
      s.id,
      s.name,
      s."jobRole" as role,
      s.avatar_url as "avatarUrl",
      b.public_slug as "publicSlug",
      similarity(s.name, ${query}) as score

    FROM staff s
    LEFT JOIN branches b ON b.id = s.branch_id

    WHERE 
      s.is_active = true
      AND (
        s.name ILIKE ${'%' + query + '%'}
        OR similarity(s.name, ${query}) > 0.3
      )
      ${cursorCondition}

    ORDER BY score DESC, s.id ASC
    LIMIT ${limit + 1}
  `);

    const data = rows<StaffSearchItem & { score: number }>(result);

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;

    const nextCursor = hasMore
      ? Buffer.from(
          JSON.stringify({
            score: items[items.length - 1].score,
            id: items[items.length - 1].id,
          }),
        ).toString('base64')
      : null;

    return { items, nextCursor };
  }
}
