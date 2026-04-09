import { Inject, Injectable } from '@nestjs/common';

import { requestContext } from 'src/modules/metrics/request-context';

import { CalendarDaySnapshot } from './core/entities/calendar-day-snapshot.entity';
import { CalendarSnapshotRepository } from './core/ports/calendar-snapshot.repository';
import { CALENDAR_SNAPSHOT_REPOSITORY } from './core/ports/tokens';
import { RecomputeCalendarSnapshotUseCase } from './core/use-cases/recompute-calendar-snapshot.use-case';

@Injectable()
export class CalendarSnapshotService {
  private readonly inflight = new Map<string, Promise<CalendarDaySnapshot>>();

  constructor(
    @Inject(CALENDAR_SNAPSHOT_REPOSITORY)
    private readonly snapshots: CalendarSnapshotRepository,
    private readonly recomputeCalendarSnapshot: RecomputeCalendarSnapshotUseCase,
  ) {}

  async getDaySnapshot(params: {
    branchId: string;
    date: string;
    fallbackToRecompute?: boolean;
  }): Promise<CalendarDaySnapshot> {
    return requestContext.memo(
      `calendar:snapshot:day:${params.branchId}:${params.date}:${params.fallbackToRecompute !== false ? 'fallback' : 'strict'}`,
      async () => {
        const cached = await this.snapshots.get(params);
        if (cached) {
          return cached;
        }

        if (params.fallbackToRecompute === false) {
          return this.emptySnapshot(params);
        }

        const key = `${params.branchId}:${params.date}`;
        const inflight = this.inflight.get(key);
        if (inflight) {
          return inflight;
        }

        const promise = (async () => {
          await this.recomputeCalendarSnapshot.execute({
            branchId: params.branchId,
            dates: [params.date],
          });

          return (
            (await this.snapshots.get(params)) ?? this.emptySnapshot(params)
          );
        })();

        this.inflight.set(key, promise);

        try {
          return await promise;
        } finally {
          if (this.inflight.get(key) === promise) {
            this.inflight.delete(key);
          }
        }
      },
    );
  }

  async getDaySnapshots(params: {
    branchId: string;
    dates: string[];
    fallbackToRecompute?: boolean;
  }) {
    const dates = [...new Set(params.dates.filter(Boolean))];
    const snapshots = await Promise.all(
      dates.map((date) =>
        this.snapshots.get({
          branchId: params.branchId,
          date,
        }),
      ),
    );

    const missingDates = dates.filter((_, index) => !snapshots[index]);
    if (missingDates.length && params.fallbackToRecompute !== false) {
      await this.recomputeCalendarSnapshot.execute({
        branchId: params.branchId,
        dates: missingDates,
      });
    }

    return Promise.all(
      dates.map((date) =>
        this.getDaySnapshot({
          branchId: params.branchId,
          date,
          fallbackToRecompute: false,
        }),
      ),
    );
  }

  async invalidate(params: { branchId: string; date?: string }) {
    await this.snapshots.invalidate(params);
  }

  async recompute(params: { branchId: string; dates: string[] }) {
    await this.recomputeCalendarSnapshot.execute(params);
  }

  scheduleRecompute(params: { branchId: string; dates: string[] }) {
    void this.recomputeCalendarSnapshot
      .execute(params)
      .catch((error: unknown) => {
        console.error('[CalendarSnapshot] RECOMPUTE FAILED', {
          branchId: params.branchId,
          dates: params.dates,
          error,
        });
      });
  }

  private emptySnapshot(params: { branchId: string; date: string }) {
    return {
      branchId: params.branchId,
      date: params.date,
      timezone: 'America/Mexico_City',
      generatedAt: new Date().toISOString(),
      appointments: [],
      timeOffs: [],
      meta: {
        totalAppointments: 0,
        totalTimeOffs: 0,
      },
    } satisfies CalendarDaySnapshot;
  }
}
