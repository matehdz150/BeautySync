/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';

import * as client from 'src/modules/db/client';
import { branches } from 'src/modules/db/schema';

import { AvailabilityService } from '../availability.service';
import { AvailabilityCoreService } from '../availability-chain.service';

@Injectable()
export class AvailabilityPublicService {
  constructor(
    @Inject('DB') private db: client.DB,
    private availabilityService: AvailabilityService,
    private core: AvailabilityCoreService,
  ) {}

  async getAvailableDates({
    slug,
    requiredDurationMin,
    staffId,
    month,
  }: {
    slug: string;
    requiredDurationMin: number;
    staffId?: string;
    month?: string; // YYYY-MM
  }): Promise<{ date: string; available: boolean }[]> {
    // 1️⃣ Branch
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    // 2️⃣ Resolver mes
    const base = month ? DateTime.fromFormat(month, 'yyyy-MM') : DateTime.now();

    const start = base.startOf('month');
    const end = base.endOf('month');

    const days: { date: string; available: boolean }[] = [];

    // 🔒 Hard limit defensivo
    const MAX_DAYS = 31;
    let cursor = start;
    let count = 0;

    while (cursor <= end && count < MAX_DAYS) {
      const dateIso = cursor.toISODate()!;

      try {
        const availability = await this.availabilityService.getAvailability({
          branchId: branch.id,
          requiredDurationMin,
          staffId,
          date: dateIso,
        });

        const hasSlots = availability.staff.some(
          (staff) => staff.slots.length > 0,
        );

        days.push({
          date: dateIso,
          available: hasSlots,
        });
      } catch {
        days.push({
          date: dateIso,
          available: false,
        });
      }

      cursor = cursor.plus({ days: 1 });
      count++;
    }

    return days;
  }

  async getAvailableTimes({
    slug,
    serviceId,
    requiredDurationMin,
    date,
    staffId,
  }: {
    slug: string;
    serviceId?: string;
    requiredDurationMin?: number;
    date: string;
    staffId?: string;
  }) {
    // 1️⃣ Branch
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    return this.core.getAvailableTimes({
      branchId: branch.id,
      serviceId,
      requiredDurationMin,
      date,
      staffId,
    });
  }

  async getAvailableTimesChain({
    slug,
    date,
    chain,
  }: {
    slug: string;
    date: string;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    chain: { serviceId: string; staffId: string | 'ANY' }[];
  }) {
    if (!chain.length) {
      throw new BadRequestException('Chain is required');
    }

    // 1️⃣ Branch
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
    });

    if (!branch) throw new NotFoundException('Branch not found');
    if (!branch.publicPresenceEnabled)
      throw new ForbiddenException('Branch is not public');

    return this.core.getAvailableTimesChain({
      branchId: branch.id,
      date,
      chain,
    });
  }
}
