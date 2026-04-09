import { shouldLogMetric } from './metrics.config';

export type MetricPayload = Record<string, unknown>;

function replacer(_key: string, value: unknown) {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  return value;
}

export function logMetric(payload: MetricPayload) {
  if (!shouldLogMetric(payload.type)) {
    return;
  }

  const serialized = JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      ...payload,
    },
    replacer,
  );

  process.stdout.write(`${serialized}\n`);
}
