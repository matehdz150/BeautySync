import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { DateTime } from 'luxon';

import { AvailableServicesAtDto } from '../../application/dto/get-availability-for-slot.dto';
import { AvailableService } from '../entities/available-service.entity';
import { AvailabilityServicesRepository } from '../ports/availability-services.repository';
import { AVAILABILITY_SERVICES_REPOSITORY } from '../ports/tokens';
import { AvailabilitySnapshotWarmService } from '../../infrastructure/adapters/availability-snapshot-warm.service';

@Injectable()
export class GetAvailabilityAtUseCase {
  private static readonly SLOT_MIN = 15;

  constructor(
    @Inject(AVAILABILITY_SERVICES_REPOSITORY)
    private readonly servicesSnapshots: AvailabilityServicesRepository,
    private readonly availabilityWarm: AvailabilitySnapshotWarmService,
  ) {}

  async execute(dto: AvailableServicesAtDto): Promise<AvailableService[]> {
    const normalizedStart = this.normalizeStart(dto.datetime);
    const targetStartMs = normalizedStart.toUTC().toMillis();
    const snapshots = await this.loadCandidateSnapshots(
      dto.branchId,
      normalizedStart,
    );

    for (const snapshot of snapshots) {
      const services = this.mapAvailableServices(snapshot, targetStartMs);
      if (services.length > 0) {
        return services;
      }
    }

    return [];
  }

  private normalizeStart(datetime: string) {
    const parsed = DateTime.fromISO(datetime, { setZone: true });

    if (!parsed.isValid) {
      throw new BadRequestException('Invalid datetime');
    }

    const local = parsed.startOf('minute');
    const extraMinutes =
      (GetAvailabilityAtUseCase.SLOT_MIN -
      (local.minute % GetAvailabilityAtUseCase.SLOT_MIN)) %
      GetAvailabilityAtUseCase.SLOT_MIN;

    return local.plus({ minutes: extraMinutes });
  }

  private mapAvailableServices(
    snapshot: {
      staff: Array<{ id: string; name: string; avatarUrl: string | null }>;
      services: Array<{
        serviceId: string;
        serviceName: string;
        durationMin: number;
        priceCents: number;
        category: { colorHex: string | null } | null;
        availableSlots: Array<{ start: string; staffIds: string[] }>;
      }>;
    },
    targetStartMs: number,
  ): AvailableService[] {
    const staffById = new Map(
      (snapshot.staff ?? []).map((member) => [member.id, member]),
    );

    return (snapshot.services ?? []).flatMap((service) => {
      const availableStaffIds =
        service.availableSlots.find(
          (slot) => new Date(slot.start).getTime() === targetStartMs,
        )?.staffIds ?? [];

      if (!availableStaffIds.length) {
        return [];
      }

      const staff = availableStaffIds
        .map((staffId) => staffById.get(staffId))
        .filter(
          (
            member,
          ): member is { id: string; name: string; avatarUrl: string | null } =>
            Boolean(member),
        )
        .map((member) => ({
          id: member.id,
          name: member.name,
          avatarUrl: member.avatarUrl,
        }));

      if (!staff.length) {
        return [];
      }

      return [
        new AvailableService(
          service.serviceId,
          service.serviceName,
          service.durationMin,
          service.priceCents,
          service.category?.colorHex ?? null,
          staff.length > 1,
          staff,
        ),
      ];
    });
  }

  private async loadCandidateSnapshots(branchId: string, start: DateTime) {
    const candidateDates = this.buildCandidateDates(start);
    const snapshots: Array<{
      staff: Array<{ id: string; name: string; avatarUrl: string | null }>;
      services: Array<{
        serviceId: string;
        serviceName: string;
        durationMin: number;
        priceCents: number;
        category: { colorHex: string | null } | null;
        availableSlots: Array<{ start: string; staffIds: string[] }>;
      }>;
    }> = [];

    for (const date of candidateDates) {
      let snapshot = await this.servicesSnapshots.get(branchId, date);
      if (snapshot) {
        console.log('[AvailabilityAt] CACHE HIT', branchId, date);
        if (this.isStale(snapshot)) {
          void this.revalidate(branchId, date);
        }
      } else {
        console.log('[AvailabilityAt] CACHE MISS', branchId, date);
        snapshot = await this.buildOrWarm(branchId, date);
      }

      if (snapshot && !this.isSnapshotUsable(snapshot)) {
        console.log('[AvailabilityAt] CACHE REBUILD', branchId, date);
        snapshot = await this.buildOrWarm(branchId, date);
      }

      if (snapshot && this.isSnapshotUsable(snapshot)) {
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

  private isSnapshotUsable(snapshot: unknown): snapshot is {
    staff: Array<{ id: string; name: string; avatarUrl: string | null }>;
    services: Array<{
      serviceId: string;
      serviceName: string;
      durationMin: number;
      priceCents: number;
      category: { colorHex: string | null } | null;
      availableSlots: Array<{ start: string; staffIds: string[] }>;
    }>;
  } {
    if (!snapshot || typeof snapshot !== 'object') {
      return false;
    }

    const candidate = snapshot as {
      staff?: unknown;
      services?: unknown;
    };

    return Array.isArray(candidate.staff) && Array.isArray(candidate.services);
  }

  private async buildOrWarm(branchId: string, date: string) {
    void this.availabilityWarm.enqueueServicesDay({ branchId, date });
    void this.availabilityWarm.enqueueDay({ branchId, date });
    return null;
  }

  private async revalidate(branchId: string, date: string) {
    void this.availabilityWarm.enqueueServicesDay({ branchId, date });
  }

  private isStale(snapshot: { staleAt?: string; expiresAt?: string }) {
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
