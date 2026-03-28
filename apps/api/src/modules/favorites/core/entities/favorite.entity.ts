// core/entities/favorite.entity.ts

export type Favorite = {
  id: string;
  userId: string;
  branchId: string;
  createdAt: Date;
};

export type FavoriteBranch = {
  branchId: string;
  name: string;
  coverImage?: string;
  ratingAvg: number;
  lat: number;
  lng: number;
  address?: string;
};
