// favorites.controller.ts

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';

import { ToggleFavoriteUseCase } from '../core/use-cases/toggle-favorite.use-case';
import { GetUserFavoritesUseCase } from '../core/use-cases/get-favorites.use-case';
import { RemoveFavoriteUseCase } from '../core/use-cases/remove-favorite.use-case';

// 🔥 TU GUARD REAL
import { PublicAuthGuard } from 'src/modules/auth/application/guards/public-auth.guard';

// 🔥 TU DECORATOR
import {
  PublicSession,
  PublicUser,
} from 'src/modules/auth/application/decorators/public-user.decorator';

@Controller('favorites')
@UseGuards(PublicAuthGuard)
export class FavoritesController {
  constructor(
    private readonly toggleFavorite: ToggleFavoriteUseCase,
    private readonly getFavorites: GetUserFavoritesUseCase,
    private readonly removeFavorite: RemoveFavoriteUseCase,
  ) {}

  // =========================
  // 📋 GET FAVORITES
  // =========================

  @Get()
  async getMyFavorites(@PublicUser() user: PublicSession) {
    return this.getFavorites.execute(user.publicUserId);
  }

  // =========================
  // 🔁 TOGGLE
  // =========================

  @Post(':branchId/toggle')
  async toggle(
    @Param('branchId') branchId: string,
    @PublicUser() user: PublicSession,
  ) {
    return this.toggleFavorite.execute(user.publicUserId, branchId);
  }

  // =========================
  // ❌ REMOVE
  // =========================

  @Delete(':branchId')
  async remove(
    @Param('branchId') branchId: string,
    @PublicUser() user: PublicSession,
  ) {
    return this.removeFavorite.execute(user.publicUserId, branchId);
  }
}
