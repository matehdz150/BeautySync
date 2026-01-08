import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule, // 👈 AHORA SÍ LLEGA JwtService
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
