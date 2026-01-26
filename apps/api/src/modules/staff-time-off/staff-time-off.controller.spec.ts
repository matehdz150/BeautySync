import { Test, TestingModule } from '@nestjs/testing';
import { StaffTimeOffController } from './staff-time-off.controller';
import { StaffTimeOffService } from './staff-time-off.service';

describe('StaffTimeOffController', () => {
  let controller: StaffTimeOffController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffTimeOffController],
      providers: [StaffTimeOffService],
    }).compile();

    controller = module.get<StaffTimeOffController>(StaffTimeOffController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
