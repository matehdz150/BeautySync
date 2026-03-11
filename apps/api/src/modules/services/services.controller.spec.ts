import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './application/controllers/services.controller';
import { ServicesService } from './manager/services.service';

describe('ServicesController', () => {
  let controller: ServicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [ServicesService],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
