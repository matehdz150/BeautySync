import { Test, TestingModule } from '@nestjs/testing';
import { StaffTimeOffService } from './staff-time-off.service';

describe('StaffTimeOffService', () => {
  let service: StaffTimeOffService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StaffTimeOffService],
    }).compile();

    service = module.get<StaffTimeOffService>(StaffTimeOffService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
