import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { GetAvailabilityForSlotDto } from '../../application/dto/get-availability-for-slot.dto';
import { AvailabilityServicesSnapshot } from '../entities/availability-services-snapshot.entity';
import { AvailabilityServicesRepository } from '../ports/availability-services.repository';
import { AVAILABILITY_SERVICES_REPOSITORY } from '../ports/tokens';
import { AvailabilitySnapshotWarmService } from '../../infrastructure/adapters/availability-snapshot-warm.service';

@Injectable()
export class GetAvailableServicesForSlotFromSnapshotUseCase {
  constructor(
    @Inject(AVAILABILITY_SERVICES_REPOSITORY)
    private readonly servicesSnapshots: AvailabilityServicesRepository,
    private readonly availabilityWarm: AvailabilitySnapshotWarmService,
  ) {}

  async execute(dto: GetAvailabilityForSlotDto) {
    const normalizedStart = this.normalizeStart(dto.datetime);
    const targetStartIso = normalizedStart.toUTC().toISO();
    if (!targetStartIso) {
      return [];
    }

    const snapshots = await this.loadCandidateSnapshots(
      dto.branchId,
      normalizedStart,
    );

    for (const snapshot of snapshots) {
      const services = snapshot.services.flatMap((service) => {
        const matches = service.availableSlots.some(
          (slot) =>
            slot.start === targetStartIso && slot.staffIds.includes(dto.staffId),
        );

        if (!matches) {
          return [];
        }

        return [
          {
            id: service.serviceId,
            name: service.serviceName,
            durationMin: service.durationMin,
            priceCents: service.priceCents,
            category: service.category,
          },
        ];
      });

      if (services.length > 0) {
        return services;
      }
    }

    return [];
  }

  private normalizeStart(datetime: string) {
    const hasExplicitZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(datetime);
    const parsed = hasExplicitZone
      ? DateTime.fromISO(datetime, { setZone: true })
      : DateTime.fromISO(datetime);

    if (!parsed.isValid) {
      throw new BadRequestException('Invalid datetime');
    }

    const local = parsed.startOf('minute');
    const extraMinutes = (15 - (local.minute % 15)) % 15;
    return local.plus({ minutes: extraMinutes });
  }

  private async loadCandidateSnapshots(branchId: string, start: DateTime) {
    const candidateDates = this.buildCandidateDates(start);
    const snapshots: AvailabilityServicesSnapshot[] = [];

    for (const date of candidateDates) {
      let snapshot = await this.servicesSnapshots.get(branchId, date);
      if (snapshot) {
        console.log('[AvailabilityServices] CACHE HIT', branchId, date);
        if (this.isStale(snapshot)) {
          void this.revalidate(branchId, date);
        }
      } else {
        console.log('[AvailabilityServices] CACHE MISS', branchId, date);
        snapshot = await this.buildOrWarm(branchId, date);
      }

      if (snapshot) {
        snapshots.push(snapshot);
      }
    }

    return snapshots;
  }

  private buildCandidateDates(start: DateTime) {
    const utc = start.toUTC().startOf('day');
    return [utc.minus({ days: 1 }), utc, utc.plus({ days: 1 })]
      .map((value) => value.toISODate())
      .filter((value): value is string => Boolean(value));
  }

  private async buildOrWarm(branchId: string, date: string) {
    void this.availabilityWarm.enqueueServicesDay({ branchId, date });
    void this.availabilityWarm.enqueueDay({ branchId, date });
    return null;
  }

  private async revalidate(branchId: string, date: string) {
    void this.availabilityWarm.enqueueServicesDay({ branchId, date });
  }

  private isStale(snapshot: AvailabilityServicesSnapshot) {
    const staleAtMs = snapshot.staleAt
      ? new Date(snapshot.staleAt).getTime()
      : Number.NaN;
    const expiresAtMs = snapshot.expiresAt
      ? new Date(snapshot.expiresAt).getTime()
      : Number.NaN;
    const now = Date.now();

    if (Number.isFinite(expiresAtMs) && now >= expiresAtMs) {
      return false;
    }

    if (Number.isFinite(staleAtMs)) {
      return now >= staleAtMs;
    }

    return false;
  }
}
