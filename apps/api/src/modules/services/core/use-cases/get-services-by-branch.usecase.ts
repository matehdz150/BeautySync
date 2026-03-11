// core/use-cases/getServicesByBranch.usecase.ts

import { Inject, Injectable } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../ports/tokens';
import * as serviceRepository from '../ports/service.repository';

@Injectable()
export class GetServicesByBranchUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private repo: serviceRepository.ServiceRepository,
  ) {}

  execute(branchId: string) {
    return this.repo.findAll(branchId);
  }
}
