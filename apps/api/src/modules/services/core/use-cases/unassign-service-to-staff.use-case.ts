import { Inject, Injectable } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../ports/tokens';
import * as serviceRepository from '../ports/service.repository';
import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import * as cachePort from 'src/modules/cache/core/ports/cache.port';

@Injectable()
export class UnassignServiceFromStaffUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private repo: serviceRepository.ServiceRepository,

    @Inject(CACHE_PORT)
    private cache: cachePort.CachePort,
  ) {}

  async execute(staffId: string, serviceId: string) {
    await this.repo.unassignFromStaff(staffId, serviceId);

    await this.cache.del(`public:service:${serviceId}:staff`);

    return { success: true };
  }
}
