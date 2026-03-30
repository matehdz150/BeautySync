import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/application/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/application/guards/roles.guard';
import { Roles } from '../../auth/application/decorators/roles.decorator';

import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { InviteStaffDto } from './dto/invites-staff.dto';

import { AuthenticatedUser } from '../../auth/core/entities/authenticatedUser.entity';

import { GetStaffUseCase } from '../core/use-cases/get-staff.use-case';
import { GetStaffsUseCase } from '../core/use-cases/get-all-staffs.use-case';
import { GetStaffByBranchUseCase } from '../core/use-cases/get-staff-by-branch.use-case';
import { FindStaffForServiceUseCase } from '../core/use-cases/find-staff-for-service.use-case';

import { CreateStaffUseCase } from '../core/use-cases/create-staff.use-case';
import { UpdateStaffUseCase } from '../core/use-cases/update-staff.use-case';
import { DeleteStaffUseCase } from '../core/use-cases/delete-staff.use-case';

import { InviteStaffUseCase } from '../core/use-cases/invite-staff.use-case';
import { ReinviteStaffUseCase } from '../core/use-cases/reinvite-staff.use-case';
import { GetStaffWithInvitesUseCase } from '../core/use-cases/find-staff-invites-by-branch.use-case';
import { GetInactiveStaffUseCase } from '../core/use-cases/get-inactive-staff.use-case';
import { ActivateStaffUseCase } from '../core/use-cases/activate-staff.use-case';

@Controller('staff')
export class StaffController {
  constructor(
    private readonly getStaff: GetStaffUseCase,
    private readonly getStaffs: GetStaffsUseCase,
    private readonly getStaffByBranch: GetStaffByBranchUseCase,
    private readonly findStaffForService: FindStaffForServiceUseCase,

    private readonly createStaff: CreateStaffUseCase,
    private readonly updateStaff: UpdateStaffUseCase,
    private readonly deleteStaff: DeleteStaffUseCase,

    private readonly inviteStaff: InviteStaffUseCase,
    private readonly reinviteStaff: ReinviteStaffUseCase,
    private readonly getStaffWithInvites: GetStaffWithInvitesUseCase,
    private readonly getInactiveStaff: GetInactiveStaffUseCase,
    private readonly activateStaff: ActivateStaffUseCase,
  ) {}

  @Get('for-service')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager', 'staff')
  findForService(
    @Query('branchId') branchId: string,
    @Query('serviceId') serviceId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.findStaffForService.execute({
      branchId,
      serviceId,
      user: req.user,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: { user: AuthenticatedUser }) {
    return this.getStaff.execute(id, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  findAll() {
    return this.getStaffs.execute();
  }

  @Get('/branch/:branchId/with-invites')
  findWithInvites(@Param('branchId') branchId: string) {
    return this.getStaffWithInvites.execute(branchId);
  }

  @Get('branch/:branchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager', 'staff')
  findByBranch(
    @Param('branchId') branchId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.getStaffByBranch.execute(branchId, req.user);
  }

  @Get('branch/:branchId/inactive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  findInactive(@Param('branchId') branchId: string) {
    return this.getInactiveStaff.execute(branchId);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  activate(@Param('id') id: string) {
    return this.activateStaff.execute(id);
  }

  @Post()
  create(@Body() body: CreateStaffDto) {
    return this.createStaff.execute(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.updateStaff.execute(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deleteStaff.execute(id);
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  invite(@Body() dto: InviteStaffDto, @Req() req: { user: AuthenticatedUser }) {
    return this.inviteStaff.execute({
      email: dto.email,
      staffId: dto.staffId,
      role: dto.role,
      user: req.user,
    });
  }

  @Post(':id/reinvite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  reinvite(@Param('id') id: string) {
    return this.reinviteStaff.execute(id);
  }
}
