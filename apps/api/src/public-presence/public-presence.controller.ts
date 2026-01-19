import { Controller, Get, Body, Patch, Param } from '@nestjs/common';
import { PublicPresenceService } from './public-presence.service';

@Controller('public-presence/:branchId')
export class PublicPresenceController {
  constructor(private readonly publicPresenceService: PublicPresenceService) {}

  @Get()
  getStatus(@Param('branchId') branchId: string) {
    return this.publicPresenceService.getStatus(branchId);
  }

  /* =============================
     ACTIVATE
     PATCH /branches/:id/public-presence/activate
  ============================= */
  @Patch('activate')
  activate(@Param('branchId') branchId: string) {
    return this.publicPresenceService.activate(branchId);
  }

  /* =============================
     DEACTIVATE
     PATCH /branches/:id/public-presence/deactivate
  ============================= */
  @Patch('deactivate')
  deactivate(@Param('branchId') branchId: string) {
    return this.publicPresenceService.deactivate(branchId);
  }
}
