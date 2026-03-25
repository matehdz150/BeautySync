import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CreateStaffTimeOffUseCase } from '../core/use-cases/create-staff-timeoff.use-case';
import { UpdateStaffTimeOffUseCase } from '../core/use-cases/update-staff-timeoff.use-case';
import { DeleteStaffTimeOffUseCase } from '../core/use-cases/delete-staff-timeoff.usecase';
import { GetStaffTimeOffUseCase } from '../core/use-cases/get-staff-timeoff.use-case';
import { GetBranchTimeOffUseCase } from '../core/use-cases/get-branch-timeoff.use-case';

import { UpdateStaffTimeOffRuleUseCase } from '../core/use-cases/update-staff-timeoff-rule.use-case';
import { DeleteStaffTimeOffRuleUseCase } from '../core/use-cases/delete-staff-timeoff-rule.use-case';

import { CreateStaffTimeOffDto } from './dto/create-staff-time-off.dto';
import { UpdateStaffTimeOffDto } from './dto/update-staff-time-off.dto';

import { UpdateStaffTimeOffRuleDto } from './dto/update-staff-time-off-rule.dto';
import { GetStaffTimeOffDetailUseCase } from '../core/use-cases/get-staff-timeoff-details.use-case';
import { GetAvailableTimeOffStartSlotsUseCase } from '../core/use-cases/availability/get-available-timeoff-slots.use-case';
import { GetAvailableTimeOffEndSlotsUseCase } from '../core/use-cases/availability/get-available-timeoff-end.use-case';

@Controller('staff-time-off')
export class StaffTimeOffController {
  constructor(
    private readonly createUseCase: CreateStaffTimeOffUseCase,
    private readonly updateUseCase: UpdateStaffTimeOffUseCase,
    private readonly deleteUseCase: DeleteStaffTimeOffUseCase,
    private readonly getStaffUseCase: GetStaffTimeOffUseCase,
    private readonly getBranchUseCase: GetBranchTimeOffUseCase,

    private readonly updateRuleUseCase: UpdateStaffTimeOffRuleUseCase,
    private readonly deleteRuleUseCase: DeleteStaffTimeOffRuleUseCase,
    private readonly getOneUseCase: GetStaffTimeOffDetailUseCase,

    private readonly getStartSlotsUseCase: GetAvailableTimeOffStartSlotsUseCase,
    private readonly getEndSlotsUseCase: GetAvailableTimeOffEndSlotsUseCase,
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

  @Get(':staffId/:branchId/:id')
  findOne(
    @Param('staffId') staffId: string,
    @Param('branchId') branchId: string,
    @Param('id') id: string,
  ) {
    return this.getOneUseCase.execute({
      timeOffId: Number(id),
      staffId,
      branchId,
    });
  }

  // -------------------------
  // CREATE single time off
  // -------------------------

  @Post()
  create(@Body() dto: CreateStaffTimeOffDto) {
    return this.createUseCase.execute({
      branchId: dto.branchId,
      staffId: dto.staffId,

      start: dto.start ? new Date(dto.start) : undefined,
      end: dto.end ? new Date(dto.end) : undefined,

      reason: dto.reason,

      rule: dto.rule
        ? {
            recurrenceType: dto.rule.recurrenceType,
            daysOfWeek: dto.rule.daysOfWeek,
            startTime: dto.rule.startTime,
            endTime: dto.rule.endTime,
            startDate: new Date(dto.rule.startDate),
            endDate: dto.rule.endDate ? new Date(dto.rule.endDate) : undefined,
          }
        : undefined,
    });
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

  @Get('availability/start')
  getAvailableStartSlots(
    @Query('branchId') branchId: string,
    @Query('staffId') staffId: string,
    @Query('date') date: string,
  ) {
    return this.getStartSlotsUseCase.execute({
      branchId,
      staffId,
      date,
    });
  }

  @Get('availability/end')
  getAvailableEndSlots(
    @Query('branchId') branchId: string,
    @Query('staffId') staffId: string,
    @Query('date') date: string,
    @Query('startISO') startISO: string,
  ) {
    return this.getEndSlotsUseCase.execute({
      branchId,
      staffId,
      date,
      startISO,
    });
  }
}
