import { metricsStore } from './metrics.store';
import { requestContext } from './request-context';
import { logMetric } from './structured-metrics.logger';

export type BusinessAction =
  | 'CREATE_BOOKING'
  | 'VIEW_CALENDAR'
  | 'REGISTER_USER'
  | (string & {});

export function startAction(action: BusinessAction) {
  requestContext.startAction(action);
}

export function endAction(action: BusinessAction) {
  const measured = requestContext.endAction(action);
  if (!measured) {
    return null;
  }

  const totals = metricsStore.recordAction(
    action,
    measured.durationMs,
    measured.dbQueries,
  );

  logMetric({
    type: 'action_metric',
    action,
    duration: measured.durationMs,
    requests: totals.requests,
    dbQueries: totals.dbQueries,
    avgDuration: Number(totals.avgDuration.toFixed(2)),
    requestId: requestContext.getRequestId() ?? null,
  });

  return measured;
}

export async function trackAction<T>(
  action: BusinessAction,
  fn: () => Promise<T>,
) {
  startAction(action);

  try {
    return await fn();
  } finally {
    endAction(action);
  }
}
