import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AvailabilityService } from '../availability.service';
import { GetAvailabilityDto } from '../dto/create-availability.dto';
import { GetAvailabilityForSlotDto } from '../dto/get-availability-for-slot.dto';
import { AvailabilityManagerService } from './availability.manager.service';

@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly service: AvailabilityService,
    private readonly chainService: AvailabilityManagerService,
  ) {}

  @Get()
  getAvailability(@Query() query: GetAvailabilityDto) {
    return this.service.getAvailability(query);
  }

  @Get('available-services')
  getAvailableServices(@Query() query: GetAvailabilityForSlotDto) {
    return this.service.getAvailableServicesForSlot(query);
  }

  @Post(':branchId/chain')
  async getAvailableTimesChain(
    @Param('branchId') branchId: string,
    @Body()
    body: {
      date: string;
      // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
      chain: { serviceId: string; staffId: string | 'ANY' }[];
    },
  ) {
    console.log('[CHAIN] start', {
      branchId,
      date: body.date,
      chain: body.chain,
    });

    const res = await this.chainService.getAvailableTimesChain({
      branchId,
      date: body.date,
      chain: body.chain,
    });

    return res;
  }
}
