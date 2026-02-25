// src/modules/branch/branch-settings.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { BranchSettingsService } from './branch-settings.service';
import { UpdateBranchSettingsDto } from '../dto/update-branch-settings.dto';
import { JwtAuthGuard } from 'src/modules/auth/manager/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/manager/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches/:branchId/settings')
export class BranchSettingsController {
  constructor(private readonly branchSettingsService: BranchSettingsService) {}

  /**
   * Obtener settings de una branch
   */
  @Get()
  async getByBranch(@Param('branchId', new ParseUUIDPipe()) branchId: string) {
    const settings = await this.branchSettingsService.getByBranch(branchId);

    return {
      ok: true,
      settings,
    };
  }

  /**
   * Actualizar settings de una branch
   */
  @Patch()
  async update(
    @Param('branchId', new ParseUUIDPipe()) branchId: string,
    @Body() dto: UpdateBranchSettingsDto,
  ) {
    const settings = await this.branchSettingsService.update(branchId, {
      timezone: dto.timezone,
      minBookingNoticeMin: dto.minBookingNoticeMin,
      maxBookingAheadDays: dto.maxBookingAheadDays,
      cancelationWindowMin: dto.cancelationWindowMin,
      rescheduleWindowMin: dto.rescheduleWindowMin,
      bufferBeforeMin: dto.bufferBeforeMin,
      bufferAfterMin: dto.bufferAfterMin,
    });

    return {
      ok: true,
      settings,
    };
  }
}
