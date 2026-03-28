// infrastructure/drizzle-favorites.repository.ts

import { Injectable } from '@nestjs/common';
import { db } from 'src/modules/db/client';
import { publicUserFavorites } from 'src/modules/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { FavoritesRepository } from '../../core/ports/favorites.repository';
import { FavoriteBranch } from '../../core/entities/favorite.entity';

type FavoriteBranchRow = {
  branchId: string;
  name: string;
  address: string | null;
  lat: string | number;
  lng: string | number;
  coverImage: string | null;
  ratingAvg: string | number | null;
};

@Injectable()
export class DrizzleFavoritesRepository implements FavoritesRepository {
  async addFavorite(userId: string, branchId: string) {
    await db
      .insert(publicUserFavorites)
      .values({
        userId,
        branchId,
      })
      .onConflictDoNothing(); // 🔥 evita duplicados
  }

  async removeFavorite(userId: string, branchId: string) {
    await db
      .delete(publicUserFavorites)
      .where(
        and(
          eq(publicUserFavorites.userId, userId),
          eq(publicUserFavorites.branchId, branchId),
        ),
      );
  }

  async isFavorite(userId: string, branchId: string) {
    const res = await db
      .select()
      .from(publicUserFavorites)
      .where(
        and(
          eq(publicUserFavorites.userId, userId),
          eq(publicUserFavorites.branchId, branchId),
        ),
      )
      .limit(1);

    return res.length > 0;
  }

  async getUserFavorites(userId: string): Promise<FavoriteBranch[]> {
    const result = await db.execute(sql`
    SELECT DISTINCT ON (b.id)
      b.id as "branchId",
      b.name,
      b.address,
      b.lat,
      b.lng,
      img.url as "coverImage",
      COALESCE(r.avg, 0)::float as "ratingAvg"
    FROM public_user_favorites f
    INNER JOIN branches b 
      ON b.id = f.branch_id
    LEFT JOIN branch_images img 
      ON img.branch_id = b.id AND img.is_cover = true
    LEFT JOIN (
      SELECT branch_id, AVG(rating) as avg
      FROM public_booking_ratings
      GROUP BY branch_id
    ) r ON r.branch_id = b.id
    WHERE f.user_id = ${userId}
    ORDER BY b.id, COALESCE(r.avg, 0) DESC
  `);

    const rows = result as unknown as FavoriteBranchRow[];

    return rows.map((r) => ({
      branchId: r.branchId,
      name: r.name,
      address: r.address ?? undefined,
      lat: Number(r.lat),
      lng: Number(r.lng),
      coverImage: r.coverImage ?? undefined,
      ratingAvg: Number(r.ratingAvg ?? 0),
    }));
  }
}
