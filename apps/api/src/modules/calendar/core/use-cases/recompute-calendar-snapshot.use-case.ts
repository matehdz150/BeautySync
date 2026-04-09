import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { BranchSettingsCacheService } from 'src/modules/cache/application/branch-settings-cache.service';

import { CalendarEvent } from '../entities/calendar-event.entity';
import { CalendarDaySnapshot } from '../entities/calendar-day-snapshot.entity';
import { CalendarSnapshotRepository } from '../ports/calendar-snapshot.repository';
import { CalendarEventsPort } from '../ports/calendar-events.port';
import {
  CALENDAR_EVENTS_PORT,
  CALENDAR_SNAPSHOT_REPOSITORY,
} from '../ports/tokens';

@Injectable()
export class RecomputeCalendarSnapshotUseCase {
  constructor(
    @Inject(CALENDAR_EVENTS_PORT)
    private readonly calendarEvents: CalendarEventsPort,
    @Inject(CALENDAR_SNAPSHOT_REPOSITORY)
    private readonly snapshots: CalendarSnapshotRepository,
    private readonly branchSettingsCache: BranchSettingsCacheService,
  ) {}

  async execute(params: { branchId: string; dates: string[] }) {
    const dates = [...new Set(params.dates.filter(Boolean))].sort();
    if (!dates.length) {
      return;
    }

    const timezone = await this.branchSettingsCache.getTimezone(
      params.branchId,
    );
    const firstDay = DateTime.fromISO(dates[0], { zone: timezone }).startOf(
      'day',
    );
    const lastDay = DateTime.fromISO(dates[dates.length - 1], {
      zone: timezone,
    }).startOf('day');

    const events = await this.calendarEvents.findByBranchAndRange({
      branchId: params.branchId,
      start: firstDay.toUTC().toJSDate(),
      end: lastDay.plus({ days: 1 }).toUTC().toJSDate(),
    });

    const snapshotsByDate = new Map<string, CalendarDaySnapshot>(
      dates.map((date) => [
        date,
        {
          branchId: params.branchId,
          date,
          timezone,
          generatedAt: new Date().toISOString(),
          appointments: [],
          timeOffs: [],
          meta: {
            totalAppointments: 0,
            totalTimeOffs: 0,
          },
        },
      ]),
    );

    for (const event of events) {
      for (const affectedDate of this.resolveAffectedDates(event, timezone)) {
        const snapshot = snapshotsByDate.get(affectedDate);
        if (!snapshot) {
          continue;
        }

        if (event.type === 'TIME_OFF') {
          snapshot.timeOffs.push({
            type: 'TIME_OFF',
            id: event.id,
            staffId: event.staffId,
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            reason: event.reason,
          });
          snapshot.meta.totalTimeOffs += 1;
          continue;
        }

        if (!this.matchesAppointmentDay(event, affectedDate, timezone)) {
          continue;
        }

        snapshot.appointments.push({
          type: 'APPOINTMENT',
          id: event.id,
          staffId: event.staffId,
          bookingId: event.bookingId ?? null,
          start: event.start.toISOString(),
          end: event.end.toISOString(),
          clientName: event.clientName,
          serviceName: event.serviceName,
          color: event.color,
        });
        snapshot.meta.totalAppointments += 1;
      }
    }

    await Promise.all(
      [...snapshotsByDate.values()].map((snapshot) =>
        this.snapshots.set({
          ...snapshot,
          appointments: snapshot.appointments.sort((a, b) =>
            a.start.localeCompare(b.start),
          ),
          timeOffs: snapshot.timeOffs.sort((a, b) =>
            a.start.localeCompare(b.start),
          ),
        }),
      ),
    );
  }

  private resolveAffectedDates(event: CalendarEvent, timezone: string) {
    if (event.type === 'APPOINTMENT') {
      const isoDate = DateTime.fromJSDate(event.start, { zone: 'utc' })
        .setZone(timezone)
        .toISODate();
      return isoDate ? [isoDate] : [];
    }

    const dates: string[] = [];
    let cursor = DateTime.fromJSDate(event.start, { zone: 'utc' })
      .setZone(timezone)
      .startOf('day');
    const lastDay = DateTime.fromJSDate(event.end, { zone: 'utc' })
      .setZone(timezone)
      .startOf('day');

    while (cursor <= lastDay) {
      const isoDate = cursor.toISODate();
      if (isoDate) {
        dates.push(isoDate);
      }
      cursor = cursor.plus({ days: 1 });
    }

    return dates;
  }

  private matchesAppointmentDay(
    event: Extract<CalendarEvent, { type: 'APPOINTMENT' }>,
    date: string,
    timezone: string,
  ) {
    return (
      DateTime.fromJSDate(event.start, { zone: 'utc' })
        .setZone(timezone)
        .toISODate() === date
    );
  }
}
