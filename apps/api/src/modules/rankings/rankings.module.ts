import { Module } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { RankingsController } from './rankings.controller';
import { AuthModule } from '../auth/auth.module';
import { DomainEventsModule } from 'src/shared/domain-events/domain-events.module';

@Module({
  imports: [AuthModule, DomainEventsModule],
  controllers: [RankingsController],
  providers: [RankingsService],
})
export class RankingsModule {}
