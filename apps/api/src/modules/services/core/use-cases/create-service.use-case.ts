import { Inject, Injectable } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../ports/tokens';
import * as serviceRepository from '../ports/service.repository';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import * as cachePort from 'src/modules/cache/core/ports/cache.port';

@Injectable()
export class CreateServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private repo: serviceRepository.ServiceRepository,

    @Inject(CACHE_PORT)
    private cache: cachePort.CachePort,
  ) {}

  async execute(input: serviceRepository.CreateServiceInput) {
    const service = await this.repo.create(input);

    await this.cache.delPattern('public:services:branch:*');

    return service;
  }
}
