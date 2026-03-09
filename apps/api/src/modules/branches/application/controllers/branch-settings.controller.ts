import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';

import { UpdateBranchSettingsDto } from '../dto/update-branch-settings.dto';

import { JwtAuthGuard } from 'src/modules/auth/application/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/application/guards/roles.guard';

import { GetBranchSettingsUseCase } from '../../core/use-cases/manager/get-branch-settings.use-case';
import { UpdateBranchSettingsUseCase } from '../../core/use-cases/manager/update-branch-settings.use-case';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches/:branchId/settings')
export class BranchSettingsController {
  constructor(
    private readonly getSettingsUseCase: GetBranchSettingsUseCase,
    private readonly updateSettingsUseCase: UpdateBranchSettingsUseCase,
  ) {}

  /**
   * Obtener settings de una branch
   */
  @Get()
  async getByBranch(@Param('branchId', new ParseUUIDPipe()) branchId: string) {
    const settings = await this.getSettingsUseCase.execute(branchId);

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
    const settings = await this.updateSettingsUseCase.execute(branchId, {
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
