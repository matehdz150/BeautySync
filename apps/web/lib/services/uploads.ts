import { API_URL } from "./api";

export type UploadResult = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
};

/* ------------------------------------------ */
/* Upload image                                */
/* ------------------------------------------ */
export async function uploadImage(
  file: File,
  folder = "misc"
): Promise<UploadResult> {
  const token = localStorage.getItem("accessToken");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    `${API_URL}/uploads/image?folder=${folder}`,
    {
      method: "POST",
      body: formData,
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : undefined,
      credentials: "include",
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Error uploading image");
  }

  return res.json();
}

/* ------------------------------------------ */
/* Delete image                                */
/* ------------------------------------------ */
export async function deleteImage(publicId: string) {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(
    `${API_URL}/uploads/image?publicId=${encodeURIComponent(publicId)}`,
    {
      method: "DELETE",
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : undefined,
      credentials: "include",
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Error deleting image");
  }

  return res.json();
}