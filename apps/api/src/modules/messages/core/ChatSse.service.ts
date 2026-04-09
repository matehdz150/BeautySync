import { Injectable } from '@nestjs/common';
import express from 'express';
import { metricsStore } from 'src/modules/metrics/metrics.store';
import { logMetric } from 'src/modules/metrics/structured-metrics.logger';

@Injectable()
export class ChatSseService {
  private clients = new Map<string, Set<express.Response>>();

  private getActiveConnections() {
    let total = 0;

    for (const set of this.clients.values()) {
      total += set.size;
    }

    return total;
  }

  addClient(conversationId: string, res: express.Response) {
    let set = this.clients.get(conversationId);

    if (!set) {
      set = new Set();
      this.clients.set(conversationId, set);
    }

    set.add(res);
  }

  removeClient(conversationId: string, res: express.Response) {
    const set = this.clients.get(conversationId);
    if (!set) return;

    set.delete(res);

    if (set.size === 0) {
      this.clients.delete(conversationId);
    }
  }

  emit(conversationId: string, event: string, payload: unknown) {
    const clients = this.clients.get(conversationId);
    if (!clients) return;

    const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    const connections = this.getActiveConnections();

    metricsStore.recordSseEvent();
    logMetric({
      type: 'sse_event',
      event,
      connections,
    });

    for (const res of clients) {
      res.write(data);
    }
  }
  isActive(conversationId: string): boolean {
    return (this.clients.get(conversationId)?.size ?? 0) > 0;
  }
  isBranchActive(branchKey: string): boolean {
    return (this.clients.get(branchKey)?.size ?? 0) > 0;
  }
}
