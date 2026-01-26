import { Test, TestingModule } from '@nestjs/testing';
import { StaffSchedulesController } from './staff-schedules.controller';
import { StaffSchedulesService } from './staff-schedules.service';

describe('StaffSchedulesController', () => {
  let controller: StaffSchedulesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffSchedulesController],
      providers: [StaffSchedulesService],
    }).compile();

    controller = module.get<StaffSchedulesController>(StaffSchedulesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
