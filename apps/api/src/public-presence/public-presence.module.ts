import { Module } from '@nestjs/common';
import { PublicPresenceService } from './public-presence.service';
import { PublicPresenceController } from './public-presence.controller';

@Module({
  controllers: [PublicPresenceController],
  providers: [PublicPresenceService],
})
export class PublicPresenceModule {}
