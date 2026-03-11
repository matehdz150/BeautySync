import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityController } from './application/controllers/availability.controller';
import { AvailabilityService } from './infrastructure/adapters/availability.service';

describe('AvailabilityController', () => {
  let controller: AvailabilityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [AvailabilityService],
    }).compile();

    controller = module.get<AvailabilityController>(AvailabilityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
