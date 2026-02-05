import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { desc } from 'drizzle-orm';

import { and, eq, sql } from 'drizzle-orm';
import type * as client from 'src/modules/db/client';
import {
  branches,
  publicBookingRatings,
  publicBookings,
  services,
} from 'src/modules/db/schema';

@Injectable()
export class BranchesPublicService {
  constructor(@Inject('DB') private readonly db: client.DB) {}

  async getBySlug(slug: string) {
    if (!slug) {
      throw new BadRequestException('Slug requerido');
    }

    /* =====================
     1️⃣ BRANCH
  ===================== */

    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
      with: {
        images: true,
      },
    });

    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada');
    }

    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Sucursal no pública');
    }

    /* =====================
     2️⃣ SERVICIOS ACTIVOS
  ===================== */

    const branchServices = await this.db.query.services.findMany({
      where: and(eq(services.branchId, branch.id), eq(services.isActive, true)),
      with: {
        category: true,
      },
      orderBy: (services, { asc }) => asc(services.name),
    });

    /* =====================
     3️⃣ RATING PROMEDIO + CONTEO
  ===================== */

    const ratingAgg = await this.db
      .select({
        average: sql<number>`AVG(${publicBookingRatings.rating})`,
        count: sql<number>`COUNT(${publicBookingRatings.id})`,
      })
      .from(publicBookingRatings)
      .innerJoin(
        publicBookings,
        eq(publicBookings.id, publicBookingRatings.bookingId),
      )
      .where(eq(publicBookings.branchId, branch.id));

    const ratingCount = Number(ratingAgg[0]?.count ?? 0);

    const ratingAverage =
      ratingCount > 0 && ratingAgg[0]?.average !== null
        ? Number(Number(ratingAgg[0].average).toFixed(1))
        : null;

    /* =====================
     4️⃣ ÚLTIMAS 6 RESEÑAS
  ===================== */

    const latestReviews = await this.db
      .select({
        id: publicBookingRatings.id,
        rating: publicBookingRatings.rating,
        comment: publicBookingRatings.comment,
        createdAt: publicBookingRatings.createdAt,
      })
      .from(publicBookingRatings)
      .innerJoin(
        publicBookings,
        eq(publicBookings.id, publicBookingRatings.bookingId),
      )
      .where(eq(publicBookings.branchId, branch.id))
      .orderBy(desc(publicBookingRatings.createdAt))
      .limit(6);

    /* =====================
     5️⃣ RESPONSE PÚBLICO
  ===================== */

    return {
      id: branch.id,
      name: branch.name,
      address: branch.address,
      slug: branch.publicSlug,
      lat: branch.lat,
      lng: branch.lng,
      description: branch.description,

      rating: {
        average: ratingAverage, // number | null
        count: ratingCount, // number
        reviews: latestReviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment ?? null,
          createdAt: r.createdAt ? r.createdAt.toISOString() : null, // ✅ FIX TS18047
        })),
      },

      images: branch.images.map((img) => ({
        id: img.id,
        url: img.url,
        isCover: img.isCover,
      })),

      services: branchServices.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        durationMin: s.durationMin,
        priceCents: s.priceCents,
        category: s.category
          ? {
              id: s.category.id,
              name: s.category.name,
              icon: s.category.icon,
              hexColor: s.category.colorHex,
            }
          : null,
      })),
    };
  }
}
