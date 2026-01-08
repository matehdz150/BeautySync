import { Test, TestingModule } from '@nestjs/testing';
import { StaffSchedulesService } from './staff-schedules.service';

describe('StaffSchedulesService', () => {
  let service: StaffSchedulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StaffSchedulesService],
    }).compile();

    service = module.get<StaffSchedulesService>(StaffSchedulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
