// core/use-cases/create-recurring-timeoff.use-case.ts

import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';

import { StaffTimeOffRepository } from '../ports/staff-timeoff.repository.port';
import { STAFF_TIMEOFF_REPOSITORY } from '../ports/tokens';

@Injectable()
export class CreateRecurringTimeOffUseCase {
  constructor(
    @Inject(STAFF_TIMEOFF_REPOSITORY)
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
    const startDate = DateTime.fromISO(params.startDate);
    const endDate = DateTime.fromISO(params.endDate);

    if (!startDate.isValid || !endDate.isValid) {
      throw new BadRequestException('Invalid dates');
    }

    if (endDate < startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const instances: {
      staffId: string;
      start: Date;
      end: Date;
      reason?: string;
    }[] = [];

    let cursor = startDate.startOf('day');

    while (cursor <= endDate) {
      // Luxon weekday: 1=Mon ... 7=Sun
      const day = cursor.weekday % 7;

      if (params.daysOfWeek.includes(day)) {
        const startDt = DateTime.fromISO(
          `${cursor.toISODate()}T${params.startTime}`,
        );

        const endDt = DateTime.fromISO(
          `${cursor.toISODate()}T${params.endTime}`,
        );

        if (!startDt.isValid || !endDt.isValid) {
          throw new BadRequestException('Invalid time format');
        }

        if (endDt <= startDt) {
          throw new BadRequestException('endTime must be after startTime');
        }

        instances.push({
          staffId: params.staffId,
          start: startDt.toJSDate(),
          end: endDt.toJSDate(),
          reason: params.reason,
        });
      }

      cursor = cursor.plus({ days: 1 });
    }

    if (!instances.length) {
      return [];
    }

    await this.repo.createMany(instances);

    return {
      created: instances.length,
    };
  }
}
