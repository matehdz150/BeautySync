import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/application/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/application/guards/roles.guard';
import { Roles } from 'src/modules/auth/application/decorators/roles.decorator';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { CreateProductUseCase } from '../core/use-cases/create-product.use-case';
import { UpdateProductUseCase } from '../core/use-cases/update-product.use-case';
import { DeleteProductUseCase } from '../core/use-cases/delete-product.use-case';
import { GetProductsByBranchUseCase } from '../core/use-cases/get-products-by-branch.use-case';
import { GetProductUseCase } from '../core/use-cases/get-product.use-case';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly deleteProduct: DeleteProductUseCase,
    private readonly getProductsByBranch: GetProductsByBranchUseCase,
    private readonly getProductById: GetProductUseCase,
  ) {}

  // =========================
  // CREATE
  // =========================
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  create(
    @Body() dto: CreateProductDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.createProduct.execute({
      ...dto,
      user: req.user,
    });
  }

  // =========================
  // GET BY BRANCH
  // =========================
  @Get('branch/:branchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager', 'staff')
  findByBranch(
    @Param('branchId') branchId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.getProductsByBranch.execute(branchId, req.user);
  }

  // =========================
  // GET ONE
  // =========================
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: { user: AuthenticatedUser }) {
    return this.getProductById.execute(id, req.user);
  }

  // =========================
  // UPDATE
  // =========================
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.updateProduct.execute(id, dto, req.user);
  }

  // =========================
  // DELETE (soft delete)
  // =========================
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  delete(@Param('id') id: string, @Req() req: { user: AuthenticatedUser }) {
    return this.deleteProduct.execute(id, req.user);
  }
}
