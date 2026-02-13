import { Injectable } from '@nestjs/common';
import { Response } from 'express';

interface Client {
  res: Response;
  heartbeat: NodeJS.Timeout;
}

@Injectable()
export class NotificationsSseService {
  private branches = new Map<string, Set<Client>>();

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

    console.log('🟢 SSE CONNECTED BRANCH:', branchId);

    res.on('close', () => {
      console.log('🔴 SSE CLOSED', branchId);
      this.removeClient(branchId, res);
    });
  }

  emitToBranch(branchId: string, evt: { event: string; data: any }) {
    const clients = this.branches.get(branchId);
    if (!clients) return;

    console.log('📡 EMIT BRANCH →', branchId, evt.event);

    const payload = `event: ${evt.event}\ndata: ${JSON.stringify(evt.data)}\n\n`;

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
