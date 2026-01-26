import { Test, TestingModule } from '@nestjs/testing';
import { PublicPresenceService } from './public-presence.service';

describe('PublicPresenceService', () => {
  let service: PublicPresenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PublicPresenceService],
    }).compile();

    service = module.get<PublicPresenceService>(PublicPresenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
