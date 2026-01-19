import { Controller, Get, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { GetAvailabilityDto } from './dto/create-availability.dto';
import { GetAvailabilityForSlotDto } from './dto/get-availability-for-slot.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  @Get()
  getAvailability(@Query() query: GetAvailabilityDto) {
    return this.service.getAvailability(query);
  }

  @Get('available-services')
  getAvailableServices(@Query() query: GetAvailabilityForSlotDto) {
    return this.service.getAvailableServicesForSlot(query);
  }
}
