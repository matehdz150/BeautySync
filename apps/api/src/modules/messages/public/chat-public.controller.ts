import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  Get,
} from '@nestjs/common';

import { PublicAuthGuard } from '../../auth/public/public-auth.guard';
import { PublicUser } from '../../auth/public/public-user.decorator';

import { ChatService } from '../core/chat.service';
import { SendMessageDto } from '../manager/dto/send-message.dto';
import { GetMessagesQueryDto } from '../manager/dto/get-messages.query';

@UseGuards(PublicAuthGuard)
@Controller('public/chat')
export class ChatPublicController {
  constructor(private readonly chat: ChatService) {}

  // =========================
  // SEND MESSAGE
  // =========================
  @Post('messages')
  async sendMessage(
    @PublicUser() user: { publicUserId: string },
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.sendMessageAsPublic({
      bookingId: dto.bookingId,
      body: dto.body,
      publicUserId: user.publicUserId,
    });
  }

  // =========================
  // MARK READ
  // =========================
  @Patch(':conversationId/read')
  async markRead(
    @PublicUser() user: { publicUserId: string },
    @Param('conversationId') conversationId: string,
  ) {
    await this.chat.markConversationReadAsPublic(
      conversationId,
      user.publicUserId,
    );

    return { ok: true };
  }

  // =========================
  // GET MESSAGES
  // =========================
  @Get(':conversationId/messages')
  async getMessages(
    @PublicUser() user: { publicUserId: string },
    @Param('conversationId') conversationId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.chat.getMessagesForPublic({
      conversationId,
      cursor: query.cursor,
      limit: query.limit,
      publicUserId: user.publicUserId,
    });
  }

  @Get('booking/:bookingId')
  async getConversationByBooking(
    @PublicUser() user: { publicUserId: string },
    @Param('bookingId') bookingId: string,
  ) {
    return this.chat.getConversationPreviewForPublic({
      bookingId,
      publicUserId: user.publicUserId,
    });
  }
}
