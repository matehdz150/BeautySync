import { Inject, Injectable } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../ports/tokens';
import * as serviceRepository from '../ports/service.repository';
import * as cachePort from 'src/modules/cache/core/ports/cache.port';
import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';

@Injectable()
export class RemoveServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private repo: serviceRepository.ServiceRepository,

    @Inject(CACHE_PORT)
    private cache: cachePort.CachePort,
  ) {}

  async execute(id: string) {
    await this.repo.delete(id);

    await this.cache.delPattern('public:services:branch:*');
    await this.cache.del(`public:service:${id}:staff`);
    await this.cache.delPattern('explore:*');

    return { success: true };
  }
}
