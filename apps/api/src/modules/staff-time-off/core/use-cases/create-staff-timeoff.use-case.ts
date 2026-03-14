// core/usecases/create-staff-timeoff.usecase.ts

import { Inject, Injectable } from '@nestjs/common';
import { StaffTimeOffRepository } from '../ports/staff-timeoff.repository.port';

@Injectable()
export class CreateStaffTimeOffUseCase {
  constructor(
    @Inject('STAFF_TIMEOFF_REPOSITORY')
    private repo: StaffTimeOffRepository,
  ) {}

  async execute(params: {
    staffId: string;
    start: Date;
    end: Date;
    reason?: string;
  }) {
    if (params.start >= params.end) {
      throw new Error('Invalid time range');
    }

    return this.repo.create(params);
  }
}
