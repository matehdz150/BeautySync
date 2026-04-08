import { logMetric } from './structured-metrics.logger';
import { isMetricsEnabled } from './metrics.config';

interface EndpointStats {
  count: number;
  totalDurationMs: number;
}

interface ActionStats {
  requests: number;
  totalDurationMs: number;
  totalDbQueries: number;
}

export class MetricsStore {
  private totalRequests = 0;
  private totalBookings = 0;
  private totalJobsProcessed = 0;
  private totalSseEvents = 0;

  private readonly endpointStats = new Map<string, EndpointStats>();
  private readonly actionStats = new Map<string, ActionStats>();
  private snapshotTimer: NodeJS.Timeout | null = null;

  recordHttpMetric(route: string, durationMs: number) {
    this.totalRequests += 1;

    const current = this.endpointStats.get(route) ?? {
      count: 0,
      totalDurationMs: 0,
    };

    current.count += 1;
    current.totalDurationMs += durationMs;

    this.endpointStats.set(route, current);
  }

  recordBooking() {
    this.totalBookings += 1;
  }

  recordJob() {
    this.totalJobsProcessed += 1;
  }

  recordSseEvent() {
    this.totalSseEvents += 1;
  }

  recordAction(action: string, durationMs: number, dbQueries: number) {
    const current = this.actionStats.get(action) ?? {
      requests: 0,
      totalDurationMs: 0,
      totalDbQueries: 0,
    };

    current.requests += 1;
    current.totalDurationMs += durationMs;
    current.totalDbQueries += dbQueries;

    this.actionStats.set(action, current);

    return {
      requests: current.requests,
      dbQueries: current.totalDbQueries,
      avgDuration: current.totalDurationMs / current.requests,
    };
  }

  startSnapshotLogger(intervalMs = 10_000) {
    if (this.snapshotTimer || !isMetricsEnabled()) {
      return;
    }

    this.snapshotTimer = setInterval(() => {
      logMetric({
        type: 'metrics_snapshot',
        requests: this.totalRequests,
        bookings: this.totalBookings,
        jobs: this.totalJobsProcessed,
        sseEvents: this.totalSseEvents,
        endpointAvgDurationMs: Object.fromEntries(
          Array.from(this.endpointStats.entries()).map(([route, stats]) => [
            route,
            Number((stats.totalDurationMs / stats.count).toFixed(2)),
          ]),
        ),
      });
    }, intervalMs);

    this.snapshotTimer.unref();
  }
}

export const metricsStore = new MetricsStore();
