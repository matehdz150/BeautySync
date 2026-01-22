import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityChainService } from './availability-chain-core.service';

describe('AvailabilityChainService', () => {
  let service: AvailabilityChainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AvailabilityChainService],
    }).compile();

    service = module.get<AvailabilityChainService>(AvailabilityChainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
