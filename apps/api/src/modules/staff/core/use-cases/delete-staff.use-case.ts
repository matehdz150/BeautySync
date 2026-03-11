import { Inject, Injectable } from '@nestjs/common';
import { STAFF_REPOSITORY } from '../ports/tokens';
import * as staffRepository from '../ports/staff.repository';
import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import * as cachePort from 'src/modules/cache/core/ports/cache.port';

@Injectable()
export class DeleteStaffUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly repo: staffRepository.StaffRepository,

    @Inject(CACHE_PORT)
    private readonly cache: cachePort.CachePort,
  ) {}

  async execute(id: string) {
    const staff = await this.repo.delete(id);

    await this.cache.del(`staff:branch:${staff.branchId}`);

    return staff;
  }
}
