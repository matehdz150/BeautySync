import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { AvailabilityModule } from 'src/availability/availability.module';
import { PublicAuthModule } from './auth/public-auth.module';

@Module({
  imports: [AvailabilityModule, PublicAuthModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
