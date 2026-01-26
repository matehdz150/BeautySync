import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { OrgParamGuard } from '../auth/manager/guards/orgParam.guard';
import { JwtAuthGuard } from '../auth/manager/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/manager/guards/roles.guard';
import { Roles } from '../auth/manager/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(OrgParamGuard)
  @Get('organization/:orgId')
  findByOrganization(@Param('orgId') orgId: string) {
    return this.service.findByOrganization(orgId);
  }

  @UseGuards(OrgParamGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(OrgParamGuard)
  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.service.create(dto);
  }

  @UseGuards(OrgParamGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(OrgParamGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
