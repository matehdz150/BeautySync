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
    SELECT 
      branch_id,
      AVG(rating) as avg
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

  async getRecommendedServices(limit: number): Promise<ServiceSearchItem[]> {
    const result = await db.execute(sql`
  SELECT 
    s.id,
    s.name,
    s.duration_min as "durationMin",
    sc.icon,
    b.public_slug as "publicSlug"

  FROM services s

  LEFT JOIN service_categories sc
    ON sc.id = s.category_id

  LEFT JOIN branches b
    ON b.id = s.branch_id

  WHERE s.is_active = true

  ORDER BY s.created_at DESC

  LIMIT ${limit}
`);

    return rows<ServiceSearchItem>(result);
  }

  async getRecommendedStaff(limit: number): Promise<StaffSearchItem[]> {
    const result = await db.execute(sql`
  SELECT 
    s.id,
    s.name,
    s."jobRole" as role,
    s.avatar_url as "avatarUrl",
    b.public_slug as "publicSlug"

  FROM staff s

  LEFT JOIN branches b
    ON b.id = s.branch_id

  WHERE s.is_active = true

  ORDER BY s.created_at DESC

  LIMIT ${limit}
`);

    return rows<StaffSearchItem>(result);
  }

  // =========================
  // 🔥 SEARCH
  // =========================

  async searchBranches({
    query,
    limit,
    lat,
    lng,
  }: {
    query: string;
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

    similarity(b.name, ${query}) as score,

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
    SELECT 
      branch_id,
      AVG(rating) as avg
    FROM public_booking_ratings
    GROUP BY branch_id
  ) r ON r.branch_id = b.id

  WHERE 
    b.public_presence_enabled = true
    AND (
      b.name ILIKE ${'%' + query + '%'}
      OR similarity(b.name, ${query}) > 0.3
    )

  ORDER BY 
    b.id,
    score DESC,
    ${lat && lng ? sql`distance ASC,` : sql``}
    COALESCE(r.avg, 0) DESC

  LIMIT ${limit}
`);

    return rows<BranchSearchItem>(result);
  }

  async searchServices(query: string, limit: number) {
    const result = await db.execute(sql`
  SELECT 
    s.id,
    s.name,
    s.duration_min as "durationMin",
    sc.icon,
    b.public_slug as "publicSlug",
    similarity(s.name, ${query}) as score

  FROM services s

  LEFT JOIN service_categories sc
    ON sc.id = s.category_id

  LEFT JOIN branches b
    ON b.id = s.branch_id

  WHERE 
    s.is_active = true
    AND (
      s.name ILIKE ${'%' + query + '%'}
      OR similarity(s.name, ${query}) > 0.3
    )

  ORDER BY score DESC

  LIMIT ${limit}
`);

    return rows<ServiceSearchItem>(result);
  }

  async searchStaff(query: string, limit: number) {
    const result = await db.execute(sql`
  SELECT 
    s.id,
    s.name,
    s."jobRole" as role,
    s.avatar_url as "avatarUrl",
    b.public_slug as "publicSlug",
    similarity(s.name, ${query}) as score

  FROM staff s

  LEFT JOIN branches b
    ON b.id = s.branch_id

  WHERE 
    s.is_active = true
    AND (
      s.name ILIKE ${'%' + query + '%'}
      OR similarity(s.name, ${query}) > 0.3
    )

  ORDER BY score DESC

  LIMIT ${limit}
`);

    return rows<StaffSearchItem>(result);
  }
}
