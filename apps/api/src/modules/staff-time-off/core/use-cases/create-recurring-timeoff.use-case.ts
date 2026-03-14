// core/usecases/create-recurring-timeoff.usecase.ts

import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { StaffTimeOffRepository } from '../ports/staff-timeoff.repository.port';

@Injectable()
export class CreateRecurringTimeOffUseCase {
  constructor(
    @Inject('STAFF_TIMEOFF_REPOSITORY')
    private repo: StaffTimeOffRepository,
  ) {}

  async execute(params: {
    staffId: string;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
    startDate: string;
    endDate: string;
    reason?: string;
  }) {
    const start = DateTime.fromISO(params.startDate);
    const end = DateTime.fromISO(params.endDate);

    const instances: {
      staffId: string;
      start: Date;
      end: Date;
      reason?: string;
    }[] = [];

    let cursor = start;

    while (cursor <= end) {
      if (params.daysOfWeek.includes(cursor.weekday % 7)) {
        const startDt = DateTime.fromISO(
          `${cursor.toISODate()}T${params.startTime}`,
        );

        const endDt = DateTime.fromISO(
          `${cursor.toISODate()}T${params.endTime}`,
        );

        instances.push({
          staffId: params.staffId,
          start: startDt.toJSDate(),
          end: endDt.toJSDate(),
          reason: params.reason,
        });
      }

      cursor = cursor.plus({ days: 1 });
    }

    await this.repo.createMany(instances);
  }
}
