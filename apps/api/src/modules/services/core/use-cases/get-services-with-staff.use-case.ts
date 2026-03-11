import { Inject, Injectable } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../ports/tokens';
import * as serviceRepository_1 from '../ports/service.repository';

@Injectable()
export class GetServicesWithStaffUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private repo: serviceRepository_1.ServiceRepository,
  ) {}

  execute(branchId: string) {
    return this.repo.findWithStaff(branchId);
  }
}
