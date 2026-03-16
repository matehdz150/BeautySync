import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateStaffTimeOffUseCase } from '../core/use-cases/create-staff-timeoff.use-case';
import { CreateRecurringTimeOffUseCase } from '../core/use-cases/create-recurring-timeoff.use-case';
import { UpdateStaffTimeOffUseCase } from '../core/use-cases/update-staff-timeoff.use-case';
import { DeleteStaffTimeOffUseCase } from '../core/use-cases/delete-staff-timeoff.usecase';
import { GetStaffTimeOffUseCase } from '../core/use-cases/get-staff-timeoff.use-case';
import { GetBranchTimeOffUseCase } from '../core/use-cases/get-branch-timeoff.use-case';

import { CreateStaffTimeOffRuleUseCase } from '../core/use-cases/create-staff-timeoff-rule.use-case';
import { UpdateStaffTimeOffRuleUseCase } from '../core/use-cases/update-staff-timeoff-rule.use-case';
import { DeleteStaffTimeOffRuleUseCase } from '../core/use-cases/delete-staff-timeoff-rule.use-case';

import { CreateStaffTimeOffDto } from './dto/create-staff-time-off.dto';
import { CreateRecurringStaffTimeOffDto } from './dto/create-recurring-staff-time-off.dto';
import { UpdateStaffTimeOffDto } from './dto/update-staff-time-off.dto';

import { CreateStaffTimeOffRuleDto } from './dto/create-staff-time-off-rule.dto';
import { UpdateStaffTimeOffRuleDto } from './dto/update-staff-time-off-rule.dto';

@Controller('staff-time-off')
export class StaffTimeOffController {
  constructor(
    private readonly createUseCase: CreateStaffTimeOffUseCase,
    private readonly createRecurringUseCase: CreateRecurringTimeOffUseCase,
    private readonly updateUseCase: UpdateStaffTimeOffUseCase,
    private readonly deleteUseCase: DeleteStaffTimeOffUseCase,
    private readonly getStaffUseCase: GetStaffTimeOffUseCase,
    private readonly getBranchUseCase: GetBranchTimeOffUseCase,

    private readonly createRuleUseCase: CreateStaffTimeOffRuleUseCase,
    private readonly updateRuleUseCase: UpdateStaffTimeOffRuleUseCase,
    private readonly deleteRuleUseCase: DeleteStaffTimeOffRuleUseCase,
  ) {}

  // -------------------------
  // GET staff time offs
  // -------------------------

  @Get('staff/:staffId')
  findForStaff(@Param('staffId') staffId: string) {
    return this.getStaffUseCase.execute(staffId);
  }

  // -------------------------
  // GET branch time offs
  // -------------------------

  @Get('branch/:branchId')
  findForBranch(@Param('branchId') branchId: string) {
    return this.getBranchUseCase.execute(branchId);
  }

  // -------------------------
  // CREATE single time off
  // -------------------------

  @Post()
  create(@Body() dto: CreateStaffTimeOffDto) {
    return this.createUseCase.execute({
      staffId: dto.staffId,
      start: new Date(dto.start),
      end: new Date(dto.end),
      reason: dto.reason,
    });
  }

  // -------------------------
  // CREATE recurring time off
  // -------------------------

  @Post('recurring')
  createRecurring(@Body() dto: CreateRecurringStaffTimeOffDto) {
    return this.createRecurringUseCase.execute(dto);
  }

  // -------------------------
  // UPDATE time off
  // -------------------------

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStaffTimeOffDto) {
    return this.updateUseCase.execute({
      id: Number(id),
      start: dto.start ? new Date(dto.start) : undefined,
      end: dto.end ? new Date(dto.end) : undefined,
      reason: dto.reason,
    });
  }

  // -------------------------
  // DELETE time off
  // -------------------------

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deleteUseCase.execute(Number(id));
  }

  // =====================================================
  // TIME OFF RULES (RECURRING BLOCKS)
  // =====================================================

  // -------------------------
  // CREATE rule
  // -------------------------

  @Post('rules')
  createRule(@Body() dto: CreateStaffTimeOffRuleDto) {
    return this.createRuleUseCase.execute({
      staffId: dto.staffId,
      recurrenceType: dto.recurrenceType!,
      daysOfWeek: dto.daysOfWeek,
      startTime: dto.startTime!,
      endTime: dto.endTime!,
      startDate: new Date(dto.startDate!),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      reason: dto.reason,
    });
  }

  // -------------------------
  // UPDATE rule
  // -------------------------

  @Patch('rules/:id')
  updateRule(@Param('id') id: string, @Body() dto: UpdateStaffTimeOffRuleDto) {
    return this.updateRuleUseCase.execute(Number(id), {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
  }

  // -------------------------
  // DELETE rule
  // -------------------------

  @Delete('rules/:id')
  deleteRule(@Param('id') id: string) {
    return this.deleteRuleUseCase.execute(Number(id));
  }
}
