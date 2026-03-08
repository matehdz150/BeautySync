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
import { OrganizationAccessGuard } from 'src/modules/auth/application/guards/organization-access.guard';
import { JwtAuthGuard } from '../auth/application/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/application/guards/roles.guard';
import { Roles } from '../auth/application/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(OrganizationAccessGuard)
  @Get('organization/:orgId')
  findByOrganization(@Param('orgId') orgId: string) {
    return this.service.findByOrganization(orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(OrganizationAccessGuard)
  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.service.create(dto);
  }

  @UseGuards(OrganizationAccessGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(OrganizationAccessGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
