import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@Controller('branches')
export class BranchesController {
  constructor(private readonly service: BranchesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
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
