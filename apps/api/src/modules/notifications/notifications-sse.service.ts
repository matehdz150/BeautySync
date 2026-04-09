import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { metricsStore } from '../metrics/metrics.store';
import { logRealtimeDebug } from '../metrics/metrics.config';
import { logMetric } from '../metrics/structured-metrics.logger';

interface Client {
  res: Response;
  heartbeat: NodeJS.Timeout;
}

@Injectable()
export class NotificationsSseService {
  private branches = new Map<string, Set<Client>>();

  private getActiveConnections() {
    let total = 0;

    for (const clients of this.branches.values()) {
      total += clients.size;
    }

    return total;
  }

  addClient(branchId: string, res: Response) {
    if (!this.branches.has(branchId)) {
      this.branches.set(branchId, new Set());
    }

    const client: Client = {
      res,
      heartbeat: setInterval(() => {
        res.write(`:keepalive\n\n`);
      }, 15000),
    };

    this.branches.get(branchId)!.add(client);

    logRealtimeDebug('🟢 SSE CONNECTED BRANCH:', branchId);

    res.on('close', () => {
      logRealtimeDebug('🔴 SSE CLOSED', branchId);
      this.removeClient(branchId, res);
    });
  }

  emitToBranch(branchId: string, evt: { event: string; data: any }) {
    const clients = this.branches.get(branchId);
    if (!clients) return;

    logRealtimeDebug('📡 EMIT BRANCH →', branchId, evt.event);

    const payload = `event: ${evt.event}\ndata: ${JSON.stringify(evt.data)}\n\n`;
    const connections = this.getActiveConnections();

    metricsStore.recordSseEvent();
    logMetric({
      type: 'sse_event',
      event: evt.event,
      connections,
    });

    for (const client of clients) {
      client.res.write(payload);
    }
  }

  removeClient(branchId: string, res: Response) {
    const set = this.branches.get(branchId);
    if (!set) return;

    for (const client of set) {
      if (client.res === res) {
        clearInterval(client.heartbeat);
        set.delete(client);
      }
    }

    if (!set.size) this.branches.delete(branchId);
  }
}
