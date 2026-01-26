import { Module } from '@nestjs/common';
import { PublicPresenceService } from './public-presence.service';
import { PublicPresenceController } from './public-presence.controller';
import { AuthModule } from '../auth/manager/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PublicPresenceController],
  providers: [PublicPresenceService],
})
export class PublicPresenceModule {}
