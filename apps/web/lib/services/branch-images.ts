import { api } from "./api";

/* =====================
   TYPES
===================== */

export type BranchImage = {
  id: string;
  branchId: string;
  url: string;
  publicId: string;
  isCover: boolean;
  position: number;
  createdAt: string;
};

/* =====================
   GET IMAGES
   GET /branches/:branchId/images
===================== */
export async function getBranchImages(
  branchId: string
): Promise<BranchImage[]> {
  return api(`/branches/${branchId}/images`);
}

/* =====================
   ADD IMAGE
   POST /branches/:branchId/images
===================== */
export async function addBranchImage(
  branchId: string,
  input: {
    url: string;
    publicId: string;
    isCover?: boolean;
  }
): Promise<BranchImage> {
  return api(`/branches/${branchId}/images`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* =====================
   UPDATE IMAGE
   PATCH /branches/:branchId/images/:imageId
===================== */
export async function updateBranchImage(
  branchId: string,
  imageId: string,
  input: {
    isCover?: boolean;
    position?: number;
  }
): Promise<BranchImage> {
  return api(`/branches/${branchId}/images/${imageId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/* =====================
   DELETE IMAGE
   DELETE /branches/:branchId/images/:imageId
===================== */
export async function deleteBranchImage(
  branchId: string,
  imageId: string
): Promise<BranchImage> {
  return api(`/branches/${branchId}/images/${imageId}`, {
    method: "DELETE",
  });
}