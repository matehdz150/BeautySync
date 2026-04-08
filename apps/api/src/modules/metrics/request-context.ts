import { AsyncLocalStorage } from 'node:async_hooks';

interface ActionStartState {
  startedAt: bigint;
  dbQueriesAtStart: number;
}

export interface RequestContextState {
  requestId: string;
  queryCount: number;
  actions: Map<string, ActionStartState[]>;
  /**
   * Per-request memoization (AsyncLocalStorage-scoped).
   * Useful to avoid repeated DB lookups inside a single HTTP request.
   *
   * Values can be either the resolved value or an in-flight Promise (dedupe).
   */
  cache: Map<string, unknown>;
}

export class RequestContextManager {
  private readonly storage = new AsyncLocalStorage<RequestContextState>();

  run<T>(state: RequestContextState, callback: () => T): T {
    return this.storage.run(state, callback);
  }

  get(): RequestContextState | undefined;
  get<T>(key: string): T | undefined;
  get<T>(key?: string): RequestContextState | T | undefined {
    if (typeof key === 'string') {
      return this.storage.getStore()?.cache.get(key) as T | undefined;
    }

    return this.storage.getStore();
  }

  set<T>(key: string, value: T): T {
    const state = this.storage.getStore();
    if (state) {
      state.cache.set(key, value);
    }

    return value;
  }

  getRequestId() {
    return this.storage.getStore()?.requestId;
  }

  /**
   * Get or compute a value once per request. Concurrent callers share the same promise.
   * If the factory throws/rejects, the cache entry is cleared to allow retry.
   */
  getOrSet<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const state = this.storage.getStore();
    if (!state) {
      return factory();
    }

    const existing = state.cache.get(key) as Promise<T> | T | undefined;
    if (existing) {
      return existing instanceof Promise ? existing : Promise.resolve(existing);
    }

    const promise = factory()
      .then((value) => {
        state.cache.set(key, value);
        return value;
      })
      .catch((err) => {
        state.cache.delete(key);
        throw err;
      });

    state.cache.set(key, promise);
    return promise;
  }

  memo<T>(key: string, factory: () => Promise<T>): Promise<T> {
    return this.getOrSet(key, factory);
  }

  incrementQueryCount() {
    const state = this.storage.getStore();
    if (!state) {
      return;
    }

    state.queryCount += 1;
  }

  startAction(action: string) {
    const state = this.storage.getStore();
    if (!state) {
      return;
    }

    const starts = state.actions.get(action) ?? [];

    starts.push({
      startedAt: process.hrtime.bigint(),
      dbQueriesAtStart: state.queryCount,
    });

    state.actions.set(action, starts);
  }

  endAction(action: string) {
    const state = this.storage.getStore();
    if (!state) {
      return null;
    }

    const starts = state.actions.get(action);
    if (!starts?.length) {
      return null;
    }

    const start = starts.pop();
    if (!start) {
      return null;
    }

    const durationMs =
      Number(process.hrtime.bigint() - start.startedAt) / 1_000_000;
    const dbQueries = state.queryCount - start.dbQueriesAtStart;

    return {
      durationMs: Number(durationMs.toFixed(2)),
      dbQueries,
    };
  }
}

export const requestContext = new RequestContextManager();
