import { DateTime } from 'luxon';

import { AvailabilityDaySnapshot } from '../../core/entities/availability-day-snapshot.entity';
import { AvailabilityServicesSnapshot } from '../../core/entities/availability-services-snapshot.entity';

const STALE_AFTER_SECONDS = 30;
const EXPIRE_AFTER_SECONDS = 300;

export function buildAvailabilityServicesSnapshot(
  snapshot: AvailabilityDaySnapshot,
): AvailabilityServicesSnapshot {
  if (!snapshot?.branchId || !snapshot?.date || !snapshot?.timezone) {
    throw new Error('Invalid snapshot: missing required root fields');
  }

  if (!Array.isArray(snapshot.services)) {
    throw new Error('Invalid snapshot: missing required services');
  }

  const generatedAt = new Date();

  return {
    branchId: snapshot.branchId,
    date: snapshot.date,
    generatedAt: generatedAt.toISOString(),
    staleAt: new Date(
      generatedAt.getTime() + STALE_AFTER_SECONDS * 1000,
    ).toISOString(),
    expiresAt: new Date(
      generatedAt.getTime() + EXPIRE_AFTER_SECONDS * 1000,
    ).toISOString(),
    staff: snapshot.staff.map((member) => ({
      id: member.id,
      name: member.name,
      avatarUrl: member.avatarUrl,
    })),
    services: snapshot.services.map((service) => {
      if (!service?.id || !service?.name) {
        throw new Error('Invalid snapshot: missing required service fields');
      }

      if (!Array.isArray(service.availableStaffIdsByStart)) {
        throw new Error('Invalid snapshot: missing required availability data');
      }

      const availableStaffIds = new Set<string>();
      const availableSlots = service.availableStaffIdsByStart.map(
        ([startMs, staffIds]) => {
          if (!Number.isFinite(startMs)) {
            throw new Error('Invalid snapshot: missing required slot start');
          }

          if (
            !Array.isArray(staffIds) ||
            staffIds.some((staffId) => !staffId)
          ) {
            throw new Error('Invalid snapshot: missing required staffId');
          }

          for (const staffId of staffIds) {
            availableStaffIds.add(staffId);
          }

          const startAt = DateTime.fromMillis(startMs, {
            zone: 'utc',
          }).setZone(snapshot.timezone);
          const endAt = startAt.plus({ minutes: service.durationMin });

          return {
            start: startAt.toUTC().toISO() as string,
            end: endAt.toUTC().toISO() as string,
            staffIds,
          };
        },
      );

      return {
        serviceId: service.id,
        serviceName: service.name,
        durationMin: service.durationMin,
        priceCents: service.priceCents,
        category: {
          id: service.categoryId,
          name: service.categoryName,
          colorHex: service.categoryColor,
        },
        availableStaffIds: [...availableStaffIds],
        availableSlots,
      };
    }),
  };
}

export const availabilityServicesSnapshotTiming = {
  staleAfterSeconds: STALE_AFTER_SECONDS,
  expireAfterSeconds: EXPIRE_AFTER_SECONDS,
};
