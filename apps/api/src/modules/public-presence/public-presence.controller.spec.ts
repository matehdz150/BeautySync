import { Test, TestingModule } from '@nestjs/testing';
import { PublicPresenceController } from './public-presence.controller';
import { PublicPresenceService } from './public-presence.service';

describe('PublicPresenceController', () => {
  let controller: PublicPresenceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicPresenceController],
      providers: [PublicPresenceService],
    }).compile();

    controller = module.get<PublicPresenceController>(PublicPresenceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
