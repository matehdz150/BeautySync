import { Inject, Injectable } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../ports/tokens';
import * as serviceRepository from '../ports/service.repository';
import * as cachePort from 'src/modules/cache/core/ports/cache.port';
import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';

@Injectable()
export class AssignServiceToStaffUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private repo: serviceRepository.ServiceRepository,

    @Inject(CACHE_PORT)
    private cache: cachePort.CachePort,
  ) {}

  async execute(staffId: string, serviceId: string) {
    await this.repo.assignToStaff(staffId, serviceId);

    await this.cache.del(`public:service:${serviceId}:staff`);

    return { success: true };
  }
}
