import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { GetPublicAvailableDatesUseCase } from '../../core/use-cases/public/get-public-available-days.use-case';
import { GetPublicAvailableTimesUseCase } from '../../core/use-cases/public/get-public-available-times.use-case';
import { GetPublicAvailableTimesChainUseCase } from '../../core/use-cases/public/get-public-available-times-chain.use-case';

@Controller('public')
export class AvailabilityPublicController {
  constructor(
    private readonly getAvailableDates: GetPublicAvailableDatesUseCase,
    private readonly getAvailableTimes: GetPublicAvailableTimesUseCase,
    private readonly getAvailableTimesChain: GetPublicAvailableTimesChainUseCase,
  ) {}

  @Get(':slug/availability/dates')
  getAvailableDatesEndpoint(
    @Param('slug') slug: string,
    @Query('requiredDurationMin') requiredDurationMin: string,
    @Query('staffId') staffId?: string,
    @Query('month') month?: string,
  ) {
    return this.getAvailableDates.execute({
      slug,
      requiredDurationMin: Number(requiredDurationMin),
      staffId,
      month,
    });
  }

  @Get(':slug/availability/times')
  getAvailableTimesEndpoint(
    @Param('slug') slug: string,
    @Query('date') date: string,

    // legacy
    @Query('serviceId') serviceId?: string,

    // nuevo
    @Query('requiredDurationMin') requiredDurationMin?: string,

    @Query('staffId') staffId?: string,
  ) {
    return this.getAvailableTimes.execute({
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
  getAvailableTimesChainEndpoint(
    @Param('slug') slug: string,
    @Body()
    body: {
      date: string;
      chain: { serviceId: string; staffId: string }[];
    },
  ) {
    return this.getAvailableTimesChain.execute({
      slug,
      date: body.date,
      chain: body.chain,
    });
  }
}
