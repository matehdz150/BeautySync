import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { GetAvailabilityDto } from '../dto/create-availability.dto';
import {
  AvailableServicesAtDto,
  GetAvailabilityForSlotDto,
} from '../dto/get-availability-for-slot.dto';
import { GetAvailabilityUseCase } from '../../core/use-cases/get-availability.use-case';
import { GetAvailableServicesForSlotUseCase } from '../../core/use-cases/get-available-services-for-slot.use-case';
import { GetAvailableServicesAtUseCase } from '../../core/use-cases/get-available-services-at.use-case';
import { GetAvailableTimesChainUseCase } from '../../core/use-cases/get-available-times-chain.use-case';
import { ChainStep } from '../../core/entities/availability-chain.entity';

@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly getAvailability: GetAvailabilityUseCase,
    private readonly getAvailableServicesForSlot: GetAvailableServicesForSlotUseCase,
    private readonly getAvailableServicesAt: GetAvailableServicesAtUseCase,
    private readonly getAvailableTimesChain: GetAvailableTimesChainUseCase,
  ) {}

  @Get()
  getAvailabilityEndpoint(@Query() query: GetAvailabilityDto) {
    return this.getAvailability.execute(query);
  }

  @Get('available-services')
  getAvailableServices(@Query() query: GetAvailabilityForSlotDto) {
    return this.getAvailableServicesForSlot.execute(query);
  }

  @Post(':branchId/chain')
  async getAvailableTimesChainEndpoint(
    @Param('branchId') branchId: string,
    @Body()
    body: {
      date: string;
      chain: ChainStep[];
    },
  ) {
    console.log('[CHAIN] start', {
      branchId,
      date: body.date,
      chain: body.chain,
    });

    const res = await this.getAvailableTimesChain.execute({
      branchId,
      date: body.date,
      chain: body.chain,
    });

    return res;
  }

  @Post('available-services-at')
  async availableServicesAt(@Body() dto: AvailableServicesAtDto) {
    const services = await this.getAvailableServicesAt.execute(dto);

    return {
      ok: true,
      services,
    };
  }
}
