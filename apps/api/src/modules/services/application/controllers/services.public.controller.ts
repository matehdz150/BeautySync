import { Controller, Get, Param } from '@nestjs/common';
import { GetPublicServicesByBranchSlugUseCase } from '../../core/use-cases/public/get-public-services-by-branch.use-case';
import { GetStaffForServicePublicUseCase } from '../../core/use-cases/public/get-staff-for-service-public.use-case';

@Controller('public')
export class ServicesPublicController {
  constructor(
    private readonly getServices: GetPublicServicesByBranchSlugUseCase,
    private readonly getStaff: GetStaffForServicePublicUseCase,
  ) {}

  @Get(':slug/services')
  getPublicServices(@Param('slug') slug: string) {
    return this.getServices.execute(slug);
  }

  @Get(':slug/services/:serviceId/staff')
  getStaffForService(
    @Param('slug') slug: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.getStaff.execute({ slug, serviceId });
  }
}
