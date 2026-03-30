import { Module } from '@nestjs/common';

/* =========================
   CONTROLLER
========================= */
import { ProductsController } from './application/products.controller';

/* =========================
   USE CASES
========================= */
import { CreateProductUseCase } from './core/use-cases/create-product.use-case';
import { UpdateProductUseCase } from './core/use-cases/update-product.use-case';
import { DeleteProductUseCase } from './core/use-cases/delete-product.use-case';
import { GetProductsByBranchUseCase } from './core/use-cases/get-products-by-branch.use-case';
import { GetProductUseCase } from './core/use-cases/get-product.use-case';

/* =========================
   REPOSITORY (DRIZZLE)
========================= */
import { DrizzleProductRepository } from './infrastructure/adapters/drizzle-product.repository';

/* =========================
   TOKENS
========================= */
import { PRODUCT_REPOSITORY } from './core/ports/tokens';

/* =========================
   DEPENDENCIES
========================= */
import { CacheModule } from '../cache/cache.module';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [
    CacheModule, // 🔥 Cache
    BranchesModule, // 🔥 Para validar acceso
  ],

  controllers: [ProductsController],

  providers: [
    /* =========================
       USE CASES
    ========================= */
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    GetProductsByBranchUseCase,
    GetProductUseCase,

    /* =========================
       REPOSITORY BINDING
    ========================= */
    {
      provide: PRODUCT_REPOSITORY,
      useClass: DrizzleProductRepository,
    },
  ],

  exports: [CreateProductUseCase, GetProductsByBranchUseCase],
})
export class ProductsModule {}
