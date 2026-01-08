import { Body, Controller, Delete, Post } from '@nestjs/common';
import { StaffServicesService } from './staff-services.service';
import { LinkStaffServiceDto } from './dto/create-staff-service.dto';

@Controller('staff-services')
export class StaffServicesController {
  constructor(private readonly service: StaffServicesService) {}

  @Post()
  link(@Body() dto: LinkStaffServiceDto) {
    return this.service.link(dto);
  }

  @Delete()
  unlink(@Body() dto: LinkStaffServiceDto) {
    return this.service.unlink(dto);
  }
}
