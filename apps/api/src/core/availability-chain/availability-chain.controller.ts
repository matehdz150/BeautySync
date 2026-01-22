import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { CurrentUser } from 'src/auth/user.decorator';

import { AvailabilityChainManagerService } from './availability-chain-manager.service';
import { AvailabilityChainPublicService } from './availability-chain-public.service';

type ChainBody = {
  date: string; // YYYY-MM-DD
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  chain: { serviceId: string; staffId: string | 'ANY' }[];
};

@Controller()
export class AvailabilityChainController {
  constructor(
    private readonly publicService: AvailabilityChainPublicService,
    private readonly managerService: AvailabilityChainManagerService,
  ) {}

  // ============================
  // PUBLIC (sin auth)
  // ============================
  @Post('/public/branches/:slug/availability/chain')
  async getPublicChain(@Param('slug') slug: string, @Body() body: ChainBody) {
    return this.publicService.getAvailableTimesChain({
      slug,
      date: body.date,
      chain: body.chain,
    });
  }

  // ============================
  // MANAGER (con auth)
  // ============================
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'ADMIN') // ajusta a tus roles reales
  @Post('/manager/branches/:branchId/availability/chain')
  async getManagerChain(
    @Param('branchId') branchId: string,
    @Body() body: ChainBody,
    @CurrentUser() user: { organizationId: string; role: string; id: string },
  ) {
    return this.managerService.getAvailableTimesChain({
      branchId,
      date: body.date,
      chain: body.chain,
      organizationId: user.organizationId,
    });
  }
}
