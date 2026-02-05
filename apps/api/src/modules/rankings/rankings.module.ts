import { Module } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { RankingsController } from './rankings.controller';
import { PublicAuthModule } from '../auth/public/public-auth.module';

@Module({
  imports: [PublicAuthModule],
  controllers: [RankingsController],
  providers: [RankingsService],
})
export class RankingsModule {}
