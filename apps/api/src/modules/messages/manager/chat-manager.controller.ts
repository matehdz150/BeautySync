import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/manager/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/manager/guards/roles.guard';
import { Roles } from '../../auth/manager/roles.decorator';

import { ChatService } from '../core/chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from 'src/modules/auth/manager/user.decorator';
import { GetMessagesQueryDto } from './dto/get-messages.query';
import type express from 'express';
import { ChatSseService } from '../core/ChatSse.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'staff')
@Controller('manager/chat')
export class ChatManagerController {
  constructor(
    private readonly chat: ChatService,
    private readonly sse: ChatSseService,
  ) {}

  // =========================
  // SEND MESSAGE
  // =========================
  @Post('messages')
  async sendMessage(
    @CurrentUser() user: { id: string; orgId: string },
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.sendMessage({
      bookingId: dto.bookingId,
      body: dto.body,
      actor: {
        type: 'USER',
        userId: user.id,
      },
    });
  }

  // =========================
  // MARK READ
  // =========================
  @Patch(':conversationId/read')
  async markRead(
    @CurrentUser() user: { id: string },
    @Param('conversationId') conversationId: string,
  ) {
    await this.chat.markConversationRead(conversationId, {
      type: 'USER',
      userId: user.id,
    });

    return { ok: true };
  }

  // =========================
  // INBOX
  // =========================
  @Get('inbox')
  async inbox(
    @CurrentUser() user: { id: string; orgId: string },
    @Query('branchId') branchId: string,
  ) {
    return this.chat.getInboxForManager({
      organizationId: user.orgId,
      branchId,
      userId: user.id,
    });
  }

  // =========================
  // GET MESSAGES
  // =========================
  @Get(':conversationId/messages')
  async getMessages(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('conversationId') conversationId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.chat.getMessagesForManager({
      conversationId,
      cursor: query.cursor,
      limit: query.limit,
      organizationId: user.orgId,
      actor: {
        type: 'USER',
        userId: user.id,
      },
    });
  }

  @Get('branch/:branchId/stream')
  streamBranch(
    @Param('branchId') branchId: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.flushHeaders();

    res.write('retry: 10000\n\n');
    res.write(`event: connected\ndata: ${JSON.stringify({ branchId })}\n\n`);

    this.sse.addClient(`branch:${branchId}`, res);

    req.on('close', () => {
      this.sse.removeClient(`branch:${branchId}`, res);
    });
  }

  @Get('booking/:bookingId/conversation')
  async getConversationPreview(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('bookingId') bookingId: string,
  ) {
    return this.chat.getConversationPreviewForManager({
      bookingId,
      organizationId: user.orgId,
      userId: user.id,
    });
  }
}
