"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseCalendarDataOptions<T> = {
  requestKey: string | null;
  enabled?: boolean;
  fetcher: (signal: AbortSignal) => Promise<T>;
};

type UseCalendarDataResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<T | null>;
};

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useCalendarData<T>({
  requestKey,
  enabled = true,
  fetcher,
}: UseCalendarDataOptions<T>): UseCalendarDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef(new Map<string, T>());
  const dataRef = useRef<T | null>(null);
  const inFlightRef = useRef<{ key: string; promise: Promise<T | null> } | null>(
    null,
  );
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const load = useCallback(
    async (options?: { force?: boolean }) => {
      if (!enabled || !requestKey) {
        return null;
      }

      const force = options?.force ?? false;
      const cached = cacheRef.current.get(requestKey);

      if (!force && lastKeyRef.current === requestKey) {
        return cached ?? dataRef.current;
      }

      if (!force && cached) {
        lastKeyRef.current = requestKey;
        setData(cached);
        setError(null);
        setLoading(false);
        return cached;
      }

      if (!force && inFlightRef.current?.key === requestKey) {
        return inFlightRef.current.promise;
      }

      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);

      const requestPromise = fetcher(controller.signal)
        .then((result) => {
          if (controller.signal.aborted) {
            return null;
          }

          cacheRef.current.set(requestKey, result);
          lastKeyRef.current = requestKey;
          setData(result);
          return result;
        })
        .catch((requestError: unknown) => {
          if (isAbortError(requestError)) {
            return null;
          }

          const nextError =
            requestError instanceof Error
              ? requestError
              : new Error("Calendar request failed");

          setError(nextError);
          throw nextError;
        })
        .finally(() => {
          if (inFlightRef.current?.promise === requestPromise) {
            inFlightRef.current = null;
          }

          if (abortRef.current === controller) {
            abortRef.current = null;
          }

          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });

      inFlightRef.current = {
        key: requestKey,
        promise: requestPromise,
      };

      return requestPromise;
    },
    [enabled, fetcher, requestKey],
  );

  const refresh = useCallback(() => load({ force: true }), [load]);

  useEffect(() => {
    if (!enabled || !requestKey) {
      return;
    }

    void load();

    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [enabled, load, requestKey]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}
