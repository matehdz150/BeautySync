import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { STAFF_REPOSITORY } from '../ports/tokens';
import * as staffRepository from '../ports/staff.repository';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import * as cachePort from 'src/modules/cache/core/ports/cache.port';

@Injectable()
export class ActivateStaffUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly repo: staffRepository.StaffRepository,

    @Inject(CACHE_PORT)
    private readonly cache: cachePort.CachePort,
  ) {}

  async execute(staffId: string) {
    const staff = await this.repo.findById(staffId);

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    if (staff.isActive) {
      throw new BadRequestException('Staff already active');
    }

    const updated = await this.repo.activate(staffId);

    // 🔥 invalidar cache
    await this.cache.del(`staff:branch:${staff.branchId}`);

    return updated;
  }
}
