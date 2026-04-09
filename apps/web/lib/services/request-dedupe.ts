type DedupOptions = {
  cacheTtlMs?: number;
};

type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

const inFlightRequests = new Map<string, Promise<unknown>>();
const responseCache = new Map<string, CacheEntry>();

function nowMs() {
  return Date.now();
}

export function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys(obj[key]);
        return acc;
      }, {});
  }

  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function normalizeBodyForKey(body: RequestInit["body"]) {
  if (!body) return "";
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body) as unknown;
      return stableStringify(parsed);
    } catch {
      return body;
    }
  }

  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  return String(body);
}

export function buildDedupKey(
  method: string,
  url: string,
  body?: unknown
) {
  return `${method.toUpperCase()}::${url}::${
    body === undefined ? "" : stableStringify(body)
  }`;
}

export function buildRequestKey(url: string, init?: RequestInit) {
  const method = (init?.method ?? 'GET').toUpperCase();
  const credentials = init?.credentials ?? '';
  const body = normalizeBodyForKey(init?.body);

  return `${method}::${url}::${credentials}::${body}`;
}

export function requestDedup<T>(key: string, factory: () => Promise<T>) {
  const existing = inFlightRequests.get(key) as Promise<T> | undefined;
  if (existing) {
    return existing;
  }

  const promise = factory().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise as Promise<unknown>);
  return promise;
}

export async function cachedRequest<T>(
  key: string,
  factory: () => Promise<T>,
  ttlMs = 2000
) {
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > nowMs()) {
    return cached.value as T;
  }

  if (cached && cached.expiresAt <= nowMs()) {
    responseCache.delete(key);
  }

  return requestDedup(key, async () => {
    const result = await factory();
    responseCache.set(key, {
      value: result,
      expiresAt: nowMs() + ttlMs,
    });
    return result;
  });
}

export async function runDeduped<T>(
  key: string,
  factory: () => Promise<T>,
  options?: DedupOptions,
): Promise<T> {
  const ttlMs = options?.cacheTtlMs ?? 0;

  if (ttlMs > 0) {
    const cached = responseCache.get(key);

    if (cached && cached.expiresAt > nowMs()) {
      return cached.value as T;
    }

    if (cached && cached.expiresAt <= nowMs()) {
      responseCache.delete(key);
    }
  }

  return requestDedup(key, async () => {
    const result = await factory();

    if (ttlMs > 0) {
      responseCache.set(key, {
        value: result,
        expiresAt: nowMs() + ttlMs,
      });
    }

    return result;
  });
}

export function invalidateCachedRequests(
  matcher: string | RegExp | ((key: string) => boolean),
) {
  const matches =
    typeof matcher === "function"
      ? matcher
      : (key: string) =>
          typeof matcher === "string" ? key.includes(matcher) : matcher.test(key);

  for (const key of responseCache.keys()) {
    if (matches(key)) {
      responseCache.delete(key);
    }
  }
}
