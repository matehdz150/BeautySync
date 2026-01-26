import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';

import { ServiceCategoriesService } from './service-categories.service';

import { JwtAuthGuard } from 'src/modules/auth/manager/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/manager/guards/roles.guard';
import { Roles } from 'src/modules/auth/manager/roles.decorator';

import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@Controller('service-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
export class ServiceCategoriesController {
  constructor(private readonly service: ServiceCategoriesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateServiceCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
