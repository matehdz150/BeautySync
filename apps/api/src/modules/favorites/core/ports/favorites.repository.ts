// core/ports/favorites.repository.ts

import { FavoriteBranch } from '../entities/favorite.entity';

export interface FavoritesRepository {
  addFavorite(userId: string, branchId: string): Promise<void>;
  removeFavorite(userId: string, branchId: string): Promise<void>;
  isFavorite(userId: string, branchId: string): Promise<boolean>;
  getUserFavorites(userId: string): Promise<FavoriteBranch[]>;
}
