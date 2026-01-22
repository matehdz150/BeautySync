import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityChainController } from './availability-chain.controller';
import { AvailabilityChainService } from './availability-chain-core.service';

describe('AvailabilityChainController', () => {
  let controller: AvailabilityChainController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityChainController],
      providers: [AvailabilityChainService],
    }).compile();

    controller = module.get<AvailabilityChainController>(AvailabilityChainController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
