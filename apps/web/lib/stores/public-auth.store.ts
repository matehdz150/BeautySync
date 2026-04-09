import { fetchCached, invalidateFetchCache } from "@/lib/services/fetch-cached";

const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const AUTH_ME_CACHE_KEY = "public-auth:me";

export type PublicUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

type PublicAuthState = {
  user: PublicUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
};

const listeners = new Set<() => void>();

let state: PublicAuthState = {
  user: null,
  loading: false,
  initialized: false,
  error: null,
};

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<PublicAuthState>) {
  state = { ...state, ...patch };
  emit();
}

export function subscribePublicAuth(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPublicAuthSnapshot() {
  return state;
}

export async function loadPublicAuth(options?: {
  force?: boolean;
  ttlMs?: number;
}) {
  const force = options?.force ?? false;
  const ttlMs = options?.ttlMs ?? 10_000;

  if (!state.loading) {
    setState({ loading: true, error: null });
  }

  try {
    const user = await fetchCached<PublicUser | null>(
      AUTH_ME_CACHE_KEY,
      async () => {
        const res = await fetch(`${PUBLIC_API_URL}/public/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          return null;
        }

        const json = (await res.json().catch(() => null)) as
          | { user?: PublicUser | null }
          | null;
        return json?.user ?? null;
      },
      { force, ttlMs }
    );

    setState({
      user,
      loading: false,
      initialized: true,
      error: null,
    });

    return user;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load public auth";

    setState({
      user: null,
      loading: false,
      initialized: true,
      error: message,
    });

    return null;
  }
}

export async function refreshPublicAuth() {
  return loadPublicAuth({ force: true, ttlMs: 0 });
}

export async function logoutPublicAuth() {
  await fetch(`${PUBLIC_API_URL}/public/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => undefined);

  invalidateFetchCache(AUTH_ME_CACHE_KEY);
  setState({
    user: null,
    loading: false,
    initialized: true,
    error: null,
  });
}
