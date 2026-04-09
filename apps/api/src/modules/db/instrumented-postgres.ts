/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import postgres from 'postgres';
import { requestContext } from '../metrics/request-context';
import { logMetric } from '../metrics/structured-metrics.logger';
import { getDbSlowQueryMs } from '../metrics/metrics.config';

const WRAPPED_CLIENT = Symbol('wrapped_postgres_client');
const WRAPPED_UNSAFE_RESULT = Symbol('wrapped_unsafe_result');

function normalizeQueryText(query: unknown): string {
  if (typeof query === 'string') {
    return query.replace(/\s+/g, ' ').trim().slice(0, 1000);
  }

  if (Array.isArray(query)) {
    return query.join('?').replace(/\s+/g, ' ').trim().slice(0, 1000);
  }

  return '[drizzle_query]';
}

function createFinalizeQueryMetric(query: unknown) {
  const startedAt = process.hrtime.bigint();
  const queryText = normalizeQueryText(query);
  let finalized = false;

  return () => {
    if (finalized) {
      return;
    }
    finalized = true;

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const roundedDuration = Number(durationMs.toFixed(2));

    requestContext.incrementQueryCount();

    const requestId = requestContext.getRequestId() ?? null;

    logMetric({
      type: 'db_query',
      requestId,
      duration: roundedDuration,
      query: queryText,
    });

    if (roundedDuration > getDbSlowQueryMs()) {
      logMetric({
        type: 'db_slow_query',
        requestId,
        duration: roundedDuration,
        query: queryText,
      });
    }
  };
}

function instrumentUnsafeResult<T>(result: T, query: unknown): T {
  if (!result || (typeof result !== 'object' && typeof result !== 'function')) {
    createFinalizeQueryMetric(query)();
    return result;
  }

  const resultObject = result as Record<PropertyKey, unknown>;
  if (resultObject[WRAPPED_UNSAFE_RESULT]) {
    return result;
  }

  const finalize = createFinalizeQueryMetric(query);

  const thenFn = resultObject.then;
  if (typeof thenFn === 'function') {
    resultObject.then = function wrappedThen(onFulfilled?: unknown, onRejected?: unknown) {
      const wrappedFulfilled =
        typeof onFulfilled === 'function'
          ? (value: unknown) => {
              finalize();
              return (onFulfilled as (arg: unknown) => unknown)(value);
            }
          : (value: unknown) => {
              finalize();
              return value;
            };

      const wrappedRejected =
        typeof onRejected === 'function'
          ? (error: unknown) => {
              finalize();
              return (onRejected as (arg: unknown) => unknown)(error);
            }
          : (error: unknown) => {
              finalize();
              throw error;
            };

      return (thenFn as (this: unknown, a: unknown, b: unknown) => unknown).call(
        this,
        wrappedFulfilled,
        wrappedRejected,
      );
    };
  }

  const valuesFn = resultObject.values;
  if (typeof valuesFn === 'function') {
    resultObject.values = function wrappedValues(...args: unknown[]) {
      try {
        const valuesResult = (valuesFn as (...innerArgs: unknown[]) => unknown).apply(
          this,
          args,
        );

        if (
          valuesResult &&
          typeof valuesResult === 'object' &&
          typeof (valuesResult as { then?: unknown }).then === 'function'
        ) {
          return (valuesResult as Promise<unknown>).then(
            (value) => {
              finalize();
              return value;
            },
            (error) => {
              finalize();
              throw error;
            },
          );
        }

        finalize();
        return valuesResult;
      } catch (error) {
        finalize();
        throw error;
      }
    };
  }

  Object.defineProperty(resultObject, WRAPPED_UNSAFE_RESULT, {
    value: true,
    enumerable: false,
  });

  return result;
}

function trackDbQuery<T>(query: unknown, fn: () => T): T {
  const finalize = createFinalizeQueryMetric(query);

  try {
    const result = fn();
    return instrumentUnsafeResult(result, query);
  } catch (error) {
    finalize();
    throw error;
  }
}

function wrapTransactionalClient<T extends object>(client: T): T {
  if ((client as Record<symbol, unknown>)[WRAPPED_CLIENT]) {
    return client;
  }

  const wrapped = new Proxy(client as object, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (prop === WRAPPED_CLIENT) {
        return true;
      }

      if (prop === 'unsafe' && typeof value === 'function') {
        return (query: unknown, ...args: unknown[]) =>
          trackDbQuery(query, () => value.call(target, query, ...args));
      }

      if (
        (prop === 'begin' || prop === 'savepoint') &&
        typeof value === 'function'
      ) {
        return (callback: unknown, ...args: unknown[]) => {
          if (typeof callback !== 'function') {
            return value.call(target, callback, ...args);
          }

          return value.call(
            target,
            (txClient: object) =>
              (callback as (client: object) => unknown)(
                wrapTransactionalClient(txClient),
              ),
            ...args,
          );
        };
      }

      return typeof value === 'function' ? value.bind(target) : value;
    },
    apply(target, thisArg, argArray) {
      const [query] = argArray;
      return trackDbQuery(query, () =>
        Reflect.apply(target as Function, thisArg, argArray),
      );
    },
  });

  Object.defineProperty(wrapped, WRAPPED_CLIENT, {
    value: true,
    enumerable: false,
  });

  return wrapped as T;
}

export function instrumentPostgresClient(
  rawClient: ReturnType<typeof postgres>,
): ReturnType<typeof postgres> {
  return wrapTransactionalClient(rawClient);
}
