import { CHAT_REPOSITORY, ChatRepository } from './chat.repository';
import { ChatActor, SendMessageInput, SendMessageResult } from './chat.types';
import { ChatEventBus } from './chat.event-bus';
import { Inject } from '@nestjs/common';

type HumanActor = Extract<ChatActor, { type: 'USER' | 'CLIENT' }>;

export class ChatService {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly repo: ChatRepository,
    private readonly events: ChatEventBus,
  ) {}

  // =============================
  // SEND MESSAGE
  // =============================
  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    // 1️⃣ validar booking y permisos
    const participants = await this.repo.getBookingParticipants(
      input.bookingId,
    );
    if (!participants) throw new Error('BOOKING_NOT_FOUND');

    if (input.actor.type === 'CLIENT') {
      if (participants.clientId !== input.actor.clientId) {
        throw new Error('FORBIDDEN');
      }
    }

    if (input.actor.type === 'USER') {
      const allowed = await this.repo.userBelongsToOrganization(
        input.actor.userId,
        participants.organizationId,
      );

      if (!allowed) throw new Error('FORBIDDEN');
    }

    // 2️⃣ obtener o crear conversación
    let conversationId = await this.repo.findConversationByBooking(
      input.bookingId,
    );

    let created = false;

    if (!conversationId) {
      conversationId = await this.repo.createConversation(input.bookingId);
      created = true;

      this.events.publish({
        type: 'CONVERSATION_CREATED',
        conversationId,
        bookingId: input.bookingId,
        branchId: participants.branchId,
      });
    }

    // 3️⃣ crear mensaje
    const message = await this.repo.createMessage({
      conversationId,
      body: input.body,
      actor: input.actor,
    });

    // 4️⃣ actualizar orden inbox
    await this.repo.updateLastMessage(conversationId, message.createdAt);

    // 5️⃣ marcar leído para el sender
    await this.repo.markRead(conversationId, input.actor);

    // 6️⃣ emitir evento realtime
    this.events.publish({
      type: 'MESSAGE_SENT',
      conversationId,
      bookingId: input.bookingId,
      messageId: message.id,
      actor: input.actor,
      preview: message.body.slice(0, 120),
      createdAt: message.createdAt.toISOString(),
      branchId: participants.branchId,
    });

    return {
      conversationId,
      messageId: message.id,
      created,
    };
  }

  // =============================
  // MARK AS READ
  // =============================

  async markConversationRead(conversationId: string, actor: HumanActor) {
    const readAt = new Date();

    await this.repo.markRead(conversationId, actor);

    const branchId = await this.repo.getConversationBranch(conversationId);

    this.events.publish({
      type: 'CONVERSATION_READ',
      conversationId,
      branchId,
      actor,
      readAt: readAt.toISOString(),
    });
  }

  async getInboxForManager(params: {
    organizationId: string;
    branchId: string;
    userId: string;
  }) {
    return this.repo.getInboxForBranch({
      organizationId: params.organizationId,
      branchId: params.branchId,
      userId: params.userId,
      limit: 50,
    });
  }

  async getMessages(
    conversationId: string,
    actor: HumanActor,
    cursor?: string,
    limit = 30,
  ) {
    // permiso
    const branchId = await this.repo.getConversationBranch(conversationId);
    if (!branchId) throw new Error('NOT_FOUND');

    // obtener mensajes
    const page = await this.repo.getMessages({
      conversationId,
      actor,
      cursor,
      limit,
    });

    // 🔥 abrir chat = marcar leído
    await this.markConversationRead(conversationId, actor);

    return page;
  }

  async getMessagesForManager(params: {
    conversationId: string;
    actor: Extract<ChatActor, { type: 'USER' }>;
    cursor?: string;
    limit: number;
    organizationId: string;
  }) {
    const meta = await this.repo.getConversationMeta(params.conversationId);

    if (!meta) throw new Error('CONVERSATION_NOT_FOUND');

    if (meta.organizationId !== params.organizationId)
      throw new Error('FORBIDDEN');

    const page = await this.repo.getMessages({
      conversationId: params.conversationId,
      actor: params.actor,
      cursor: params.cursor,
      limit: params.limit,
    });

    return {
      bookingId: meta.bookingId,
      branchId: meta.branchId,
      ...page,
    };
  }

  async sendMessageAsPublic(input: {
    bookingId: string;
    body: string;
    publicUserId: string;
  }) {
    const clientIds = await this.repo.getClientIdByPublicUser(
      input.publicUserId,
    );
    if (!clientIds.length) throw new Error('FORBIDDEN');

    const participants = await this.repo.getBookingParticipants(
      input.bookingId,
    );
    if (!participants) throw new Error('BOOKING_NOT_FOUND');

    if (!clientIds.includes(participants.clientId)) {
      throw new Error('FORBIDDEN');
    }

    return this.sendMessage({
      bookingId: input.bookingId,
      body: input.body,
      actor: {
        type: 'CLIENT',
        clientId: participants.clientId,
      },
    });
  }

  private async assertPublicOwnsConversation(
    publicUserId: string,
    conversationId: string,
  ) {
    // 1️⃣ obtener clients del usuario público
    const clientIds = await this.repo.getClientIdByPublicUser(publicUserId);
    if (!clientIds.length) throw new Error('FORBIDDEN');

    // 2️⃣ obtener client dueño de la conversación
    const ownerClientId = await this.repo.getConversationClient(conversationId);
    if (!ownerClientId) throw new Error('NOT_FOUND');

    // 3️⃣ validar ownership
    if (!clientIds.includes(ownerClientId)) {
      throw new Error('FORBIDDEN');
    }

    return ownerClientId;
  }

  async getMessagesForPublic(params: {
    conversationId: string;
    cursor?: string;
    limit: number;
    publicUserId: string;
  }) {
    const clientId = await this.assertPublicOwnsConversation(
      params.publicUserId,
      params.conversationId,
    );

    const meta = await this.repo.getConversationMeta(params.conversationId);

    if (!meta) {
      throw new Error('CONVERSATION_NOT_FOUND');
    }

    const page = await this.repo.getMessages({
      conversationId: params.conversationId,
      cursor: params.cursor,
      limit: params.limit,
      actor: {
        type: 'CLIENT',
        clientId,
      },
    });

    return {
      bookingId: meta.bookingId,
      branchId: meta.branchId,
      ...page,
    };
  }

  async markConversationReadAsPublic(
    conversationId: string,
    publicUserId: string,
  ) {
    const clientId = await this.assertPublicOwnsConversation(
      publicUserId,
      conversationId,
    );

    await this.repo.markRead(conversationId, {
      type: 'CLIENT',
      clientId,
    });

    const branchId = await this.repo.getConversationBranch(conversationId);

    this.events.publish({
      type: 'CONVERSATION_READ',
      conversationId,
      actor: { type: 'CLIENT', clientId },
      readAt: new Date().toISOString(),
      branchId,
    });
  }

  async getClientIdsForPublic(publicUserId: string) {
    return this.repo.getClientIdByPublicUser(publicUserId);
  }

  async publicCanAccessConversation(
    conversationId: string,
    publicUserId: string,
  ): Promise<boolean> {
    return this.repo.publicOwnsConversation(conversationId, publicUserId);
  }

  async getConversationPreviewForManager(params: {
    bookingId: string;
    organizationId: string;
    userId: string;
  }) {
    const participants = await this.repo.getBookingParticipants(
      params.bookingId,
    );

    if (!participants) throw new Error('BOOKING_NOT_FOUND');

    if (participants.organizationId !== params.organizationId) {
      throw new Error('FORBIDDEN');
    }

    return this.repo.getConversationPreviewByBooking(
      params.bookingId,
      params.userId,
    );
  }

  async getConversationPreviewForPublic(params: {
    bookingId: string;
    publicUserId: string;
  }) {
    // 1️⃣ obtener clientIds del usuario público
    const clientIds = await this.repo.getClientIdByPublicUser(
      params.publicUserId,
    );

    if (!clientIds.length) {
      throw new Error('FORBIDDEN');
    }

    // 2️⃣ validar que el booking pertenece a uno de sus clients
    const participants = await this.repo.getBookingParticipants(
      params.bookingId,
    );

    if (!participants) {
      throw new Error('BOOKING_NOT_FOUND');
    }

    if (!clientIds.includes(participants.clientId)) {
      throw new Error('FORBIDDEN');
    }

    // 3️⃣ obtener preview (igual que manager pero sin org validation)
    return this.repo.getConversationPreviewByBooking(
      params.bookingId,
      participants.clientId,
    );
  }
}
