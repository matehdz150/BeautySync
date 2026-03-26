// core/use-cases/get-service-categories.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../../ports/tokens';
import { ServiceRepository } from '../../ports/service.repository';

@Injectable()
export class GetServiceCategoriesUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly repo: ServiceRepository,
  ) {}

  async execute() {
    return this.repo.getAllCategories();
  }
}
