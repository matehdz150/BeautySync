type CacheValue = {
  value: unknown;
  expiresAt: number;
};

type FetchCachedOptions = {
  ttlMs?: number;
  force?: boolean;
};

const inFlightByKey = new Map<string, Promise<unknown>>();
const valueByKey = new Map<string, CacheValue>();

export async function fetchDedup<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const inFlight = inFlightByKey.get(key) as Promise<T> | undefined;
  if (inFlight) {
    return inFlight;
  }

  const promise = fetcher().finally(() => {
    inFlightByKey.delete(key);
  });

  inFlightByKey.set(key, promise as Promise<unknown>);
  return promise;
}

export async function fetchCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: FetchCachedOptions
): Promise<T> {
  const ttlMs = options?.ttlMs ?? 0;
  const force = options?.force ?? false;

  if (!force && ttlMs > 0) {
    const cached = valueByKey.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }
    if (cached && cached.expiresAt <= Date.now()) {
      valueByKey.delete(key);
    }
  }

  if (!force) {
    return fetchDedup(key, async () => {
      if (ttlMs > 0) {
        const cached = valueByKey.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          return cached.value as T;
        }
        if (cached && cached.expiresAt <= Date.now()) {
          valueByKey.delete(key);
        }
      }

      const result = await fetcher();
      if (ttlMs > 0) {
        valueByKey.set(key, {
          value: result,
          expiresAt: Date.now() + ttlMs,
        });
      }
      return result;
    });
  }

  const result = await fetcher();
  if (ttlMs > 0) {
    valueByKey.set(key, {
      value: result,
      expiresAt: Date.now() + ttlMs,
    });
  }
  return result;
}

export function invalidateFetchCache(key: string) {
  valueByKey.delete(key);
  inFlightByKey.delete(key);
}

export function clearFetchCache() {
  valueByKey.clear();
  inFlightByKey.clear();
}
