export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("accessToken");

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let res = await request(path, options);

  if (res.status === 401) {
    console.warn("Access token invalid — trying refresh…");

    const refresh = await request("/auth/refresh", { method: "POST" });

    if (!refresh.ok) {
      console.warn("Refresh failed — logging out");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Sesión expirada");
    }

    const data = await refresh.json();

    localStorage.setItem("accessToken", data.accessToken);

    res = await request(path, options);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}