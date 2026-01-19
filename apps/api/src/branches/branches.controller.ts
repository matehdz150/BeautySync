import { Body, Controller, Get, Param, Post, Patch } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchLocationDto } from './dto/branch-location.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Controller('branches')
export class BranchesController {
  publicBranchesService: any;
  constructor(private readonly service: BranchesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':slug')
  getPublicBranch(@Param('slug') slug: string) {
    return this.service.getBySlug(slug);
  }

  @Patch(':id/location')
  async updateLocation(
    @Param('id') id: string,
    @Body() dto: UpdateBranchLocationDto,
  ) {
    return this.service.updateLocation(id, dto);
  }

  @Get(':id/basic')
  getBasic(@Param('id') id: string) {
    return this.service.getBasic(id);
  }

  @Patch(':id')
  async updateBranch(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.service.updateBranch(id, dto);
  }

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
