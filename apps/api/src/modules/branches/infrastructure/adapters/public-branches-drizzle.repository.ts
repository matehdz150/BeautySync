import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as client from 'src/modules/db/client';
import { PublicBranchesRepository } from '../../core/ports/public-branches.repository';
import { PublicBranch } from '../../core/entities/public-branch.entity';
import { and, eq, sql, desc } from 'drizzle-orm';
import { branches } from 'src/modules/db/schema/branches/branches';
import {
  publicBookingRatings,
  publicBookings,
  services,
} from 'src/modules/db/schema';

@Injectable()
export class PublicBranchesDrizzleRepository implements PublicBranchesRepository {
  constructor(@Inject('DB') private readonly db: client.DB) {}

  async getBySlug(slug: string): Promise<PublicBranch> {
    if (!slug) {
      throw new BadRequestException('Slug requerido');
    }

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

    /* SERVICIOS */

    const branchServices = await this.db.query.services.findMany({
      where: and(eq(services.branchId, branch.id), eq(services.isActive, true)),
      with: {
        category: true,
      },
      orderBy: (services, { asc }) => asc(services.name),
    });

    /* RATING */

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

    /* REVIEWS */

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

    return {
      id: branch.id,
      name: branch.name,
      address: branch.address,
      slug: branch.publicSlug,
      lat: branch.lat,
      lng: branch.lng,
      description: branch.description,

      rating: {
        average: ratingAverage,
        count: ratingCount,
        reviews: latestReviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment ?? null,
          createdAt: r.createdAt ? r.createdAt.toISOString() : null,
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
