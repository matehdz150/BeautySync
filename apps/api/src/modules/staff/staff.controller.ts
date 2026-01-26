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
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { RolesGuard } from 'src/modules/auth/manager/guards/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/manager/guards/jwt-auth.guard';
import { Roles } from 'src/modules/auth/manager/roles.decorator';
import { InviteStaffDto } from './dto/invites-staff.dto';

@Controller('staff')
export class StaffController {
  constructor(private readonly service: StaffService) {}

  @Get('for-service')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager', 'staff')
  findForService(
    @Query('branchId') branchId: string,
    @Query('serviceId') serviceId: string,
    @Req() req,
  ) {
    return this.service.findFiltered({
      branchId,
      serviceId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      user: req.user,
    });
  }

  // staff.controller.ts
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.service.findOne(id, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  findAll() {
    return this.service.findAll();
  }

  @Get('branch/:branchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager', 'staff')
  findByBranch(@Param('branchId') branchId: string, @Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.service.findByBranch(branchId, req.user);
  }

  @Post()
  create(@Body() body: CreateStaffDto) {
    return this.service.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @Req() req: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  invite(@Body() dto: InviteStaffDto, @Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.service.inviteStaff(dto.email, dto.staffId, dto.role, req.user);
  }

  @Post(':id/reinvite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  reinvite(@Param('id') id: string) {
    return this.service.reinviteStaff(id);
  }
}
