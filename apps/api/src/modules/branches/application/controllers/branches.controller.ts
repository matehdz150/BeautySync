import { Body, Controller, Get, Param, Post, Patch } from '@nestjs/common';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchLocationUseCase } from '../../core/use-cases/manager/update-branch-location.use-case';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/application/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/application/guards/roles.guard';
import { BranchAccessGuard } from 'src/modules/auth/application/guards/branch-access.guard';
import { OrganizationAccessGuard } from 'src/modules/auth/application/guards/organization-access.guard';
import { FindAllBranchesUseCase } from '../../core/use-cases/manager/find-all-branches.use-case';
import { GetBranchBasicUseCase } from '../../core/use-cases/manager/get-basic-branch.use-case';
import { UpdateBranchUseCase } from '../../core/use-cases/manager/update-branch.use-case';
import { FindBranchesByOrgUseCase } from '../../core/use-cases/manager/find-branches-by-org.use-case';
import { CreateBranchUseCase } from '../../core/use-cases/manager/create-branch.use-case';
import { FindBranchByUserUseCase } from '../../core/use-cases/manager/find-branch-by-user.use-case';
import { UpdateBranchLocationDto } from '../dto/branch-location.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(
    private readonly findAllBranches: FindAllBranchesUseCase,
    private readonly updateBranchLocation: UpdateBranchLocationUseCase,
    private readonly getBranchBasic: GetBranchBasicUseCase,
    private readonly updateBranch: UpdateBranchUseCase,
    private readonly findBranchesByOrg: FindBranchesByOrgUseCase,
    private readonly createBranch: CreateBranchUseCase,
    private readonly findBranchByUser: FindBranchByUserUseCase,
  ) {}

  @Get()
  findAll() {
    return this.findAllBranches.execute();
  }

  @UseGuards(BranchAccessGuard)
  @Patch(':id/location')
  updateLocation(
    @Param('id') id: string,
    @Body() dto: UpdateBranchLocationDto,
  ) {
    return this.updateBranchLocation.execute(id, dto);
  }

  @UseGuards(BranchAccessGuard)
  @Get(':id/basic')
  getBasic(@Param('id') id: string) {
    return this.getBranchBasic.execute(id);
  }

  @UseGuards(BranchAccessGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.updateBranch.execute(id, dto);
  }

  @UseGuards(OrganizationAccessGuard)
  @Get('/organization/:orgId')
  findByOrg(@Param('orgId') orgId: string) {
    return this.findBranchesByOrg.execute(orgId);
  }

  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.createBranch.execute(dto);
  }

  @Get('/by-user/:userId')
  findBranchByUserRoute(@Param('userId') userId: string) {
    return this.findBranchByUser.execute(userId);
  }
}
