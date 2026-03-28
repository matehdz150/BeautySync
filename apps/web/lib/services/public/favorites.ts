import { publicFetch } from "./apiPublic";

/* ========================= */
/* TYPES */
/* ========================= */

export type FavoriteBranch = {
  branchId: string;
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  coverImage?: string;
  ratingAvg?: number;
};

export type ToggleFavoriteResponse = {
  isFavorite: boolean;
};

/* ========================= */
/* GET FAVORITES */
/* ========================= */

export async function getMyFavorites() {
  return publicFetch<FavoriteBranch[]>("/favorites");
}

/* ========================= */
/* TOGGLE FAVORITE */
/* ========================= */

export async function toggleFavorite(branchId: string) {
  return publicFetch<ToggleFavoriteResponse>(
    `/favorites/${branchId}/toggle`,
    {
      method: "POST",
    }
  );
}

/* ========================= */
/* REMOVE FAVORITE */
/* ========================= */

export async function removeFavorite(branchId: string) {
  return publicFetch<void>(`/favorites/${branchId}`, {
    method: "DELETE",
  });
}