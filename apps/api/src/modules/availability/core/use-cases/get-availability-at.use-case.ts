import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DateTime } from 'luxon';

import { AvailableServicesAtDto } from '../../application/dto/get-availability-for-slot.dto';
import { AvailableService } from '../entities/available-service.entity';
import { AvailabilityDaySnapshot } from '../entities/availability-day-snapshot.entity';
import { AvailabilitySnapshotRepository } from '../ports/availability-snapshot.repository';
import { AVAILABILITY_SNAPSHOT_REPOSITORY } from '../ports/tokens';

@Injectable()
export class GetAvailabilityAtUseCase {
  private static readonly SLOT_MIN = 15;

  constructor(
    @Inject(AVAILABILITY_SNAPSHOT_REPOSITORY)
    private readonly snapshots: AvailabilitySnapshotRepository,
  ) {}

  async execute(dto: AvailableServicesAtDto): Promise<AvailableService[]> {
    const normalizedStart = this.normalizeStart(dto.datetime);
    const targetStartMs = normalizedStart.toUTC().toMillis();
    const snapshots = await this.loadCandidateSnapshots(
      dto.branchId,
      normalizedStart,
    );

    if (!snapshots.length) {
      throw new ServiceUnavailableException('SNAPSHOT_NOT_READY');
    }

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

  private async loadCandidateSnapshots(branchId: string, start: DateTime) {
    const snapshots = await Promise.all(
      this.buildCandidateDates(start).map((date) =>
        this.snapshots.get(branchId, date),
      ),
    );

    return snapshots.filter((snapshot): snapshot is AvailabilityDaySnapshot =>
      Boolean(snapshot),
    );
  }

  private buildCandidateDates(start: DateTime) {
    const utc = start.toUTC().startOf('day');

    return [utc.minus({ days: 1 }), utc, utc.plus({ days: 1 })]
      .map((value) => value.toISODate())
      .filter((value): value is string => Boolean(value));
  }

  private mapAvailableServices(
    snapshot: AvailabilityDaySnapshot,
    targetStartMs: number,
  ): AvailableService[] {
    const staffById = new Map(
      snapshot.staff.map((member) => [member.id, member]),
    );

    return snapshot.services.flatMap((service) => {
      const availableStaffIds =
        service.availableStaffIdsByStart.find(
          ([startMs]) => startMs === targetStartMs,
        )?.[1] ?? [];

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
          service.id,
          service.name,
          service.durationMin,
          service.priceCents,
          service.categoryColor,
          staff.length > 1,
          staff,
        ),
      ];
    });
  }
}
