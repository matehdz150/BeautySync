const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

function parseBooleanEnv(value: string | undefined, defaultValue: boolean) {
  if (!value) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  return defaultValue;
}

function parseNumberEnv(value: string | undefined, defaultValue: number) {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return defaultValue;
  }

  return parsed;
}

export function isMetricsEnabled() {
  return parseBooleanEnv(process.env.ENABLE_METRICS, false);
}

export function isDbMetricsEnabled() {
  return parseBooleanEnv(process.env.ENABLE_DB_LOGS, false);
}

export function isRealtimeDebugLogsEnabled() {
  return parseBooleanEnv(process.env.ENABLE_REALTIME_LOGS, false);
}

export function getMetricsSnapshotIntervalMs() {
  return parseNumberEnv(process.env.METRICS_SNAPSHOT_INTERVAL_MS, 10_000);
}

export function getDbSlowQueryMs() {
  return parseNumberEnv(process.env.DB_SLOW_QUERY_MS, 100);
}

export function shouldLogMetric(type: unknown) {
  if (typeof type !== 'string') {
    return isMetricsEnabled();
  }

  if (type === 'db_query' || type === 'db_slow_query' || type === 'db_summary') {
    return isDbMetricsEnabled();
  }

  return isMetricsEnabled();
}

export function logRealtimeDebug(...args: unknown[]) {
  if (!isRealtimeDebugLogsEnabled()) {
    return;
  }

  console.log(...args);
}
