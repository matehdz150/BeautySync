import { Inject, Injectable } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../ports/tokens';
import * as serviceRepository from '../ports/service.repository';
import * as cachePort from 'src/modules/cache/core/ports/cache.port';
import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';

@Injectable()
export class UpdateServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private repo: serviceRepository.ServiceRepository,

    @Inject(CACHE_PORT)
    private cache: cachePort.CachePort,
  ) {}

  async execute(id: string, input: serviceRepository.UpdateServiceInput) {
    const service = await this.repo.update(id, input);

    await this.cache.delPattern('public:services:branch:*');

    return service;
  }
}
