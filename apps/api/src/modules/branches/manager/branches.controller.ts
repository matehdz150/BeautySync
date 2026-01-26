import { Body, Controller, Get, Param, Post, Patch } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchLocationDto } from '../dto/branch-location.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/manager/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/manager/guards/roles.guard';
import { OrgParamGuard } from '../../auth/manager/guards/orgParam.guard';
import { BranchOwnerGuard } from '../../auth/manager/guards/branch-owner.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  publicBranchesService: any;
  constructor(private readonly service: BranchesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  //ruta para modificar la ubicacion del local, se usa en el dashboard, en la parte de configuracion del negocio
  @UseGuards(BranchOwnerGuard)
  @Patch(':id/location')
  async updateLocation(
    @Param('id') id: string,
    @Body() dto: UpdateBranchLocationDto,
  ) {
    return this.service.updateLocation(id, dto);
  }

  @UseGuards(BranchOwnerGuard)
  @Get(':id/basic')
  getBasic(@Param('id') id: string) {
    return this.service.getBasic(id);
  }

  @UseGuards(BranchOwnerGuard)
  @Patch(':id')
  async updateBranch(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.service.updateBranch(id, dto);
  }
  @UseGuards(OrgParamGuard)
  @Get('/organization/:orgId')
  findByOrg(@Param('orgId') orgId: string) {
    return this.service.findByOrg(orgId);
  }

  @Post()
  create(@Body() body: CreateBranchDto) {
    return this.service.create(body);
  }

  @Get('/by-user/:userId')
  async findBranchByUser(@Param('userId') userId: string) {
    return this.service.findBranchByUser(userId);
  }
}
