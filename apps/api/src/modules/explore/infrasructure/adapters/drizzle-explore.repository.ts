import { Inject, Injectable } from '@nestjs/common';
import { ExploreRepository } from '../../core/ports/explore.repository';
import { DB } from 'src/modules/db/client';

import { branches } from 'src/modules/db/schema/branches';
import { branchImages } from 'src/modules/db/schema/branches';
import { publicBookingRatings } from 'src/modules/db/schema';
import { services } from 'src/modules/db/schema/services';

import { eq, sql } from 'drizzle-orm';

@Injectable()
export class DrizzleExploreRepository implements ExploreRepository {
  constructor(@Inject('DB') private db: DB) {}

  async findExploreBranches() {
    // 🔥 base branches
    const base = await this.db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        lat: branches.lat,
        lng: branches.lng,
        publicSlug: branches.publicSlug,
      })
      .from(branches)
      .where(eq(branches.publicPresenceEnabled, true));

    // 🔥 ratings agregados
    const ratings = await this.db
      .select({
        branchId: publicBookingRatings.branchId,
        avg: sql<number>`avg(${publicBookingRatings.rating})`,
        count: sql<number>`count(${publicBookingRatings.id})`,
      })
      .from(publicBookingRatings)
      .groupBy(publicBookingRatings.branchId);

    const ratingMap = new Map(ratings.map((r) => [r.branchId, r]));

    // 🔥 cover images
    const covers = await this.db
      .select({
        branchId: branchImages.branchId,
        url: branchImages.url,
      })
      .from(branchImages)
      .where(eq(branchImages.isCover, true));

    const coverMap = new Map(covers.map((c) => [c.branchId, c.url]));

    // 🔥 services
    const servicesData = await this.db
      .select({
        branchId: services.branchId,
        name: services.name,
        priceCents: services.priceCents,
        durationMin: services.durationMin,
      })
      .from(services)
      .where(eq(services.isActive, true));

    type ServiceRow = {
      branchId: string;
      name: string;
      priceCents: number | null;
      durationMin: number;
    };

    const servicesMap = new Map<string, ServiceRow[]>();

    for (const s of servicesData) {
      if (!servicesMap.has(s.branchId)) {
        servicesMap.set(s.branchId, []);
      }
      servicesMap.get(s.branchId)!.push(s);
    }

    // 🔥 merge final
    return base.map((b) => {
      const rating = ratingMap.get(b.id);
      const servicesList = servicesMap.get(b.id) ?? [];

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
        })),
      };
    });
  }
}
