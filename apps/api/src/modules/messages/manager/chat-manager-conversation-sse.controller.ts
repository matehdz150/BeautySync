/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  Inject,
  Param,
} from '@nestjs/common';
import express from 'express';
import { eq } from 'drizzle-orm';

import { JwtAuthGuard } from 'src/modules/auth/application/guards/jwt-auth.guard';
import { ChatSseService } from '../core/ChatSse.service';

import * as client from 'src/modules/db/client';
import { conversations } from 'src/modules/db/schema';

@UseGuards(JwtAuthGuard)
@Controller('manager/chat')
export class ChatConversationSseController {
  constructor(
    private readonly sse: ChatSseService,
    @Inject('DB') private db: client.DB,
  ) {}

  @Get(':conversationId/stream')
  async stream(
    @Req() req: express.Request,
    @Res() res: express.Response,
    @Param('conversationId') conversationId: string,
  ) {
    console.log('SSE CONNECT PID', process.pid);
    const user = req.user as any;

    const conversation = await this.db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      with: {
        booking: { with: { branch: true } },
      },
    });

    if (!conversation) throw new UnauthorizedException();
    if (conversation.booking.branch.organizationId !== user.orgId)
      throw new UnauthorizedException();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.flushHeaders();
    res.write('retry: 10000\n\n');
    res.write(
      `event: connected\ndata: ${JSON.stringify({ conversationId })}\n\n`,
    );

    this.sse.addClient(conversationId, res);

    req.on('close', () => {
      this.sse.removeClient(conversationId, res);
    });
  }
}
