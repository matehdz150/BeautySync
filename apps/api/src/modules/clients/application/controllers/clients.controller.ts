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

import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { OrganizationAccessGuard } from 'src/modules/auth/application/guards/organization-access.guard';
import { JwtAuthGuard } from '../../../auth/application/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/application/guards/roles.guard';
import { Roles } from '../../../auth/application/decorators/roles.decorator';
import { GetClientsUseCase } from '../../core/use-cases/get-clients.use-case';
import { GetClientUseCase } from '../../core/use-cases/get-client.use-case';
import { GetClientsByOrganizationUseCase } from '../../core/use-cases/get-client-by-org.use-case';
import { CreateClientUseCase } from '../../core/use-cases/create-client.use-case';
import { UpdateClientUseCase } from '../../core/use-cases/update-client.use-case';
import { DeleteClientUseCase } from '../../core/use-cases/delete-client.use-case';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
export class ClientsController {
  constructor(
    private readonly getClients: GetClientsUseCase,
    private readonly getClient: GetClientUseCase,
    private readonly getClientsByOrg: GetClientsByOrganizationUseCase,
    private readonly createClient: CreateClientUseCase,
    private readonly updateClient: UpdateClientUseCase,
    private readonly deleteClient: DeleteClientUseCase,
  ) {}
  @UseGuards(OrganizationAccessGuard)
  @Get()
  findAll() {
    return this.getClients.execute();
  }

  @UseGuards(OrganizationAccessGuard)
  @Get('organization/:orgId')
  findByOrganization(@Param('orgId') orgId: string) {
    return this.getClientsByOrg.execute(orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.getClient.execute(id);
  }

  @UseGuards(OrganizationAccessGuard)
  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.createClient.execute(dto);
  }

  @UseGuards(OrganizationAccessGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.updateClient.execute(id, dto);
  }

  @UseGuards(OrganizationAccessGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deleteClient.execute(id);
  }
}
