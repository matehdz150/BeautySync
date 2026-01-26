import { Controller, Get, Param } from '@nestjs/common';
import { ServicesPublicService } from './services.public.service';

@Controller('public')
export class ServicesPublicController {
  constructor(private readonly publicService: ServicesPublicService) {}

  // 1️⃣ Servicios
  @Get(':slug/services')
  getPublicServices(@Param('slug') slug: string) {
    return this.publicService.getServicesByBranchSlug(slug);
  }

  // 2️⃣ Staff por servicio
  @Get(':slug/services/:serviceId/staff')
  getStaffForService(
    @Param('slug') slug: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.publicService.getStaffForService({ slug, serviceId });
  }
}
