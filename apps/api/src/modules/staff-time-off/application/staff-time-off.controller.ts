import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
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
import { CalendarRealtimePublisher } from 'src/modules/calendar/calendar-realtime.publisher';
import * as client from 'src/modules/db/client';
import { eq } from 'drizzle-orm';
import { staff, staffTimeOff } from 'src/modules/db/schema';

@Controller('staff-time-off')
export class StaffTimeOffController {
  private async resolveBranchIdFromRuleId(ruleId: number) {
    const rule = await this.db.query.staffTimeOffRules.findFirst({
      where: (t, { eq }) => eq(t.id, ruleId),
      columns: { staffId: true },
    });

    if (!rule?.staffId) return null;

    const staffMember = await this.db.query.staff.findFirst({
      where: eq(staff.id, rule.staffId),
      columns: { branchId: true },
    });

    return staffMember?.branchId ?? null;
  }

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
    private readonly calendarRealtime: CalendarRealtimePublisher,
    @Inject('DB') private readonly db: client.DB,
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
  async create(@Body() dto: CreateStaffTimeOffDto) {
    const result = await this.createUseCase.execute({
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

    await this.calendarRealtime.emitInvalidate({
      branchId: dto.branchId,
      reason: 'timeoff.created',
    });

    return result;
  }

  // -------------------------
  // UPDATE time off
  // -------------------------

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateStaffTimeOffDto) {
    const existing = await this.db.query.staffTimeOff.findFirst({
      where: eq(staffTimeOff.id, Number(id)),
      columns: { branchId: true },
    });

    const result = await this.updateUseCase.execute({
      id: Number(id),

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

    if (existing?.branchId) {
      await this.calendarRealtime.emitInvalidate({
        branchId: existing.branchId,
        reason: 'timeoff.updated',
      });
    }

    return result;
  }

  // -------------------------
  // DELETE time off
  // -------------------------

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const existing = await this.db.query.staffTimeOff.findFirst({
      where: eq(staffTimeOff.id, Number(id)),
      columns: { branchId: true },
    });

    const result = await this.deleteUseCase.execute(Number(id));

    if (existing?.branchId) {
      await this.calendarRealtime.emitInvalidate({
        branchId: existing.branchId,
        reason: 'timeoff.deleted',
      });
    }

    return result;
  }

  // =====================================================
  // TIME OFF RULES (RECURRING BLOCKS)
  // =====================================================

  // -------------------------
  // UPDATE rule
  // -------------------------

  @Patch('rules/:id')
  async updateRule(
    @Param('id') id: string,
    @Body() dto: UpdateStaffTimeOffRuleDto,
  ) {
    const branchId = await this.resolveBranchIdFromRuleId(Number(id));

    const result = await this.updateRuleUseCase.execute(Number(id), {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });

    if (branchId) {
      await this.calendarRealtime.emitInvalidate({
        branchId,
        reason: 'timeoff.rule.updated',
      });
    }

    return result;
  }

  // -------------------------
  // DELETE rule
  // -------------------------

  @Delete('rules/:id')
  async deleteRule(@Param('id') id: string) {
    const branchId = await this.resolveBranchIdFromRuleId(Number(id));

    const result = await this.deleteRuleUseCase.execute(Number(id));

    if (branchId) {
      await this.calendarRealtime.emitInvalidate({
        branchId,
        reason: 'timeoff.rule.deleted',
      });
    }

    return result;
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
