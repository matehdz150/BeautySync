import {
  Controller,
  Get,
  Param,
  UseGuards,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type express from 'express';

import { PublicAuthGuard } from 'src/modules/auth/application/guards/public-auth.guard';
import { PublicUser } from 'src/modules/auth/application/decorators/public-user.decorator';

import { ChatSseService } from '../core/ChatSse.service';
import { ChatService } from '../core/chat.service';

@UseGuards(PublicAuthGuard)
@Controller('public/chat')
export class ChatPublicSseController {
  constructor(
    private readonly sse: ChatSseService,
    private readonly chat: ChatService,
  ) {}

  @Get(':conversationId/stream')
  async stream(
    @Param('conversationId') conversationId: string,
    @PublicUser() user: { publicUserId: string },
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    // 🔐 validar ownership
    const allowed = await this.chat.publicCanAccessConversation(
      conversationId,
      user.publicUserId,
    );

    if (!allowed) {
      throw new UnauthorizedException('Forbidden conversation');
    }

    // ===== SSE HEADERS =====
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.flushHeaders();

    // reconnect delay
    res.write('retry: 10000\n\n');

    // handshake
    res.write(
      `event: connected\ndata: ${JSON.stringify({ conversationId })}\n\n`,
    );

    // registrar cliente
    this.sse.addClient(conversationId, res);

    req.on('close', () => {
      this.sse.removeClient(conversationId, res);
    });
  }
}
