import { Inject, Injectable } from '@nestjs/common';
import { AVAILABILITY_CHAIN_REPOSITORY } from '../ports/tokens';
import * as availabilityChainRepository from '../ports/availability-chain.repository';
import { ChainStep } from '../entities/availability-chain.entity';

@Injectable()
export class GetAvailableTimesChainUseCase {
  constructor(
    @Inject(AVAILABILITY_CHAIN_REPOSITORY)
    private readonly repo: availabilityChainRepository.AvailabilityChainRepository,
  ) {}

  execute(params: { branchId: string; date: string; chain: ChainStep[] }) {
    return this.repo.getAvailableTimesChain(params);
  }
}
