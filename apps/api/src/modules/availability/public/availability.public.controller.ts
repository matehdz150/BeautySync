import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AvailabilityPublicService } from './availability.public.service';

@Controller('public')
export class AvailabilityPublicController {
  constructor(private readonly publicService: AvailabilityPublicService) {}

  @Get(':slug/availability/dates')
  getAvailableDates(
    @Param('slug') slug: string,
    @Query('requiredDurationMin') requiredDurationMin: string,
    @Query('staffId') staffId?: string,
    @Query('month') month?: string,
  ) {
    return this.publicService.getAvailableDates({
      slug,
      requiredDurationMin: Number(requiredDurationMin),
      staffId,
      month,
    });
  }

  @Get(':slug/availability/times')
  getAvailableTimes(
    @Param('slug') slug: string,
    @Query('date') date: string,

    // legacy
    @Query('serviceId') serviceId?: string,

    // nuevo
    @Query('requiredDurationMin') requiredDurationMin?: string,

    @Query('staffId') staffId?: string,
  ) {
    return this.publicService.getAvailableTimes({
      slug,
      date,
      staffId,

      serviceId: serviceId || undefined,

      requiredDurationMin:
        typeof requiredDurationMin === 'string'
          ? Number(requiredDurationMin)
          : undefined,
    });
  }

  @Post(':slug/availability/chain')
  getAvailableTimesChain(
    @Param('slug') slug: string,
    @Body()
    body: {
      date: string;
      chain: { serviceId: string; staffId: string }[];
    },
  ) {
    return this.publicService.getAvailableTimesChain({
      slug,
      date: body.date,
      chain: body.chain,
    });
  }
}
