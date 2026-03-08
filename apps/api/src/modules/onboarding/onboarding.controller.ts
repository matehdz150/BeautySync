import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/application/guards/jwt-auth.guard';
import { Roles } from '../auth/application/decorators/roles.decorator';
import { RolesGuard } from '../auth/application/guards/roles.guard';
import { OnboardOwnerDto } from './dto/onboard-owner.dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private service: OnboardingService) {}

  @Post('owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  async onboardOwner(@Req() req, @Body() dto: OnboardOwnerDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.id; // ← viene del JWT

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.service.onboardOwner(userId, dto);
  }
}
