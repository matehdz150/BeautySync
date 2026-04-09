import { metricsStore } from './metrics.store';
import { logMetric } from './structured-metrics.logger';

export async function trackJobMetric<T>(name: string, fn: () => Promise<T>) {
  const startedAt = process.hrtime.bigint();

  try {
    return await fn();
  } finally {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const roundedDuration = Number(durationMs.toFixed(2));

    metricsStore.recordJob();

    logMetric({
      type: 'job_metric',
      name,
      duration: roundedDuration,
    });
  }
}
