import { Module } from '@nestjs/common';

// =========================
// CONTROLLER
// =========================
import { FavoritesController } from './application/favorites.controller';

// =========================
// USE CASES
// =========================
import { ToggleFavoriteUseCase } from './core/use-cases/toggle-favorite.use-case';
import { GetUserFavoritesUseCase } from './core/use-cases/get-favorites.use-case';
import { RemoveFavoriteUseCase } from './core/use-cases/remove-favorite.use-case';

// =========================
// REPOSITORY (PORT + ADAPTER)
// =========================
import { FAVORITES_REPOSITORY } from './core/ports/tokens';
import { DrizzleFavoritesRepository } from './infrastructure/adapters/drizzle-favorites.repository';

// =========================
// CACHE
// =========================
import { CacheModule } from 'src/modules/cache/cache.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CacheModule, AuthModule],

  controllers: [FavoritesController],

  providers: [
    // =========================
    // USE CASES
    // =========================
    ToggleFavoriteUseCase,
    GetUserFavoritesUseCase,
    RemoveFavoriteUseCase,

    // =========================
    // REPOSITORY BINDING
    // =========================
    {
      provide: FAVORITES_REPOSITORY,
      useClass: DrizzleFavoritesRepository,
    },
  ],

  exports: [
    // 🔥 opcional (por si lo usas en otros módulos)
    ToggleFavoriteUseCase,
    GetUserFavoritesUseCase,
    FAVORITES_REPOSITORY,
  ],
})
export class FavoritesModule {}
