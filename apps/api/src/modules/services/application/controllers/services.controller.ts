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
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { Roles } from 'src/modules/auth/application/decorators/roles.decorator';
import { AssignServiceDto } from '../dto/asign-service.dto';
import { JwtAuthGuard } from 'src/modules/auth/application/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/application/guards/roles.guard';
import { AddNoteDto, AddRuleDto } from '../dto/notes.dto';
import { GetServiceUseCase } from '../../core/use-cases/get-service.use-case';
import { CreateServiceUseCase } from '../../core/use-cases/create-service.use-case';
import { GetServicesByBranchUseCase } from '../../core/use-cases/get-services-by-branch.usecase';
import { UpdateServiceUseCase } from '../../core/use-cases/update-service.use-case';
import { RemoveServiceUseCase } from '../../core/use-cases/remove-service.use-case';
import { UnassignServiceFromStaffUseCase } from '../../core/use-cases/unassign-service-to-staff.use-case';
import { GetServicesWithStaffUseCase } from '../../core/use-cases/get-services-with-staff.use-case';
import { AssignServiceToStaffUseCase } from '../../core/use-cases/assign-service-to-staff.use-case';
import { GetServiceNotesUseCase } from '../../core/use-cases/get-notes.use-case';
import { AddServiceNoteUseCase } from '../../core/use-cases/add-note.use-case';
import { RemoveServiceNoteUseCase } from '../../core/use-cases/remove-note.use-case';
import { GetServiceRulesUseCase } from '../../core/use-cases/get-rules.use-case';
import { AddServiceRuleUseCase } from '../../core/use-cases/add-rule.use-case';
import { RemoveServiceRuleUseCase } from '../../core/use-cases/remove-rule.use-case';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(
    private readonly getServices: GetServicesByBranchUseCase,
    private readonly getService: GetServiceUseCase,
    private readonly createService: CreateServiceUseCase,
    private readonly updateService: UpdateServiceUseCase,
    private readonly assignService: AssignServiceToStaffUseCase,
    private readonly unassignService: UnassignServiceFromStaffUseCase,
    private readonly getServicesWithStaff: GetServicesWithStaffUseCase,
    private readonly removeService: RemoveServiceUseCase,
    private readonly getNotes: GetServiceNotesUseCase,
    private readonly addNote: AddServiceNoteUseCase,
    private readonly removeNote: RemoveServiceNoteUseCase,
    private readonly getRules: GetServiceRulesUseCase,
    private readonly addRule: AddServiceRuleUseCase,
    private readonly removeRule: RemoveServiceRuleUseCase,
  ) {}

  @Get()
  findAll(@Query('branchId') branchId: string) {
    return this.getServices.execute(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.getService.execute(id);
  }

  @Post()
  @Roles('owner', 'manager')
  create(@Body() dto: CreateServiceDto) {
    return this.createService.execute(dto);
  }

  @Post('assign')
  @Roles('owner', 'manager')
  assign(@Body() dto: AssignServiceDto) {
    return this.assignService.execute(dto.staffId, dto.serviceId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.updateService.execute(id, dto);
  }

  @Get('branch/:branchId')
  @Roles('owner', 'manager')
  getByBranch(@Param('branchId') branchId: string) {
    return this.getServicesWithStaff.execute(branchId);
  }

  // UNASSIGN SERVICE
  @Post('unassign')
  @Roles('owner', 'manager')
  unassign(@Body() body: { staffId: string; serviceId: string }) {
    return this.unassignService.execute(body.staffId, body.serviceId);
  }

  // DELETE SERVICE
  @Delete(':id')
  @Roles('owner', 'manager')
  remove(@Param('id') id: string) {
    return this.removeService.execute(id);
  }

  @Get('notes')
  getNotesFunc(@Param('id') id: string) {
    return this.getNotes.execute(id);
  }

  @Post('notes')
  addNoteFunc(@Param('id') id: string, @Body() dto: AddNoteDto) {
    return this.addNote.execute(id, dto.text);
  }

  @Delete('notes/:index')
  deleteNote(@Param('id') id: string, @Param('index') index: string) {
    return this.removeNote.execute(id, Number(index));
  }

  @Get('rules')
  getRulesFunc(@Param('id') id: string) {
    return this.getRules.execute(id);
  }

  @Post('rules')
  addRuleFunc(@Param('id') id: string, @Body() dto: AddRuleDto) {
    return this.addRule.execute(id, dto.text);
  }

  @Delete('rules/:index')
  deleteRule(@Param('id') id: string, @Param('index') index: string) {
    return this.removeRule.execute(id, Number(index));
  }
}
