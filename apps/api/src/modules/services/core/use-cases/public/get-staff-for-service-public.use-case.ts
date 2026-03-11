import { Inject, Injectable } from '@nestjs/common';
import { SERVICE_PUBLIC_REPOSITORY } from '../../ports/tokens';
import * as servicePublicRepository from '../../ports/service-public.repository';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import * as cachePort from 'src/modules/cache/core/ports/cache.port';

@Injectable()
export class GetStaffForServicePublicUseCase {
  constructor(
    @Inject(SERVICE_PUBLIC_REPOSITORY)
    private readonly repo: servicePublicRepository.ServicePublicRepository,

    @Inject(CACHE_PORT)
    private readonly cache: cachePort.CachePort,
  ) {}

  async execute(params: { slug: string; serviceId: string }) {
    const key = `public:service:${params.serviceId}:staff`;

    const cached =
      await this.cache.get<servicePublicRepository.PublicServiceItem[]>(key);

    if (cached) {
      return cached;
    }

    const staff = await this.repo.getStaffForService(params);

    await this.cache.set(key, staff, 3600);

    return staff;
  }
}
