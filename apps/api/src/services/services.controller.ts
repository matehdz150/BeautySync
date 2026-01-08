import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Roles } from 'src/auth/roles.decorator';
import { AssignServiceDto } from './dto/asign-service.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { AddNoteDto, AddRuleDto } from './dto/notes.dto';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  findAll(@Query('branchId') branchId: string) {
    return this.services.findAll(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.services.findOne(id);
  }

  @Post()
  @Roles('owner', 'manager')
  create(@Body() dto: CreateServiceDto) {
    return this.services.create(dto);
  }

  @Post('assign')
  @Roles('owner', 'manager')
  assign(@Body() dto: AssignServiceDto) {
    return this.services.assignToStaff(dto.staffId, dto.serviceId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(id, dto);
  }

  @Get('branch/:branchId')
  @Roles('owner', 'manager')
  getByBranch(@Param('branchId') branchId: string) {
    return this.services.getByBranch(branchId);
  }

  // UNASSIGN SERVICE
  @Post('unassign')
  @Roles('owner', 'manager')
  unassign(@Body() body: { staffId: string; serviceId: string }) {
    return this.services.unassignServiceFromStaff(body.staffId, body.serviceId);
  }

  // DELETE SERVICE
  @Delete(':id')
  @Roles('owner', 'manager')
  remove(@Param('id') id: string) {
    return this.services.removeService(id);
  }

  @Get('notes')
  getNotes(@Param('id') id: string) {
    return this.services.getNotes(id);
  }

  @Post('notes')
  addNote(@Param('id') id: string, @Body() dto: AddNoteDto) {
    return this.services.addNote(id, dto.text);
  }

  @Delete('notes/:index')
  deleteNote(@Param('id') id: string, @Param('index') index: string) {
    return this.services.removeNote(id, Number(index));
  }

  @Get('rules')
  getRules(@Param('id') id: string) {
    return this.services.getRules(id);
  }

  @Post('rules')
  addRule(@Param('id') id: string, @Body() dto: AddRuleDto) {
    return this.services.addRule(id, dto.text);
  }

  @Delete('rules/:index')
  deleteRule(@Param('id') id: string, @Param('index') index: string) {
    return this.services.removeRule(id, Number(index));
  }
}
