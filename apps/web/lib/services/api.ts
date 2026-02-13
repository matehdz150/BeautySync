export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request(path: string, options: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // 🔥 obligatorio para cookies
  });
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let res = await request(path, options);

  // 🔁 Intentar refresh automático
  if (res.status === 401) {
    const refresh = await request("/auth/refresh", {
      method: "POST",
    });

    if (!refresh.ok) {
      window.location.href = "/login";
      throw new Error("Sesión expirada");
    }

    res = await request(path, options);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}