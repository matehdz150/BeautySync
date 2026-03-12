import { ChatActor, ChatInboxItem, ChatMessagePage } from './chat.types';

export abstract class ChatRepository {
  // booking -> conversation
  abstract findConversationByBooking(bookingId: string): Promise<string | null>;
  abstract createConversation(bookingId: string): Promise<string>;

  // permisos
  abstract getBookingParticipants(bookingId: string): Promise<{
    clientId: string;
    organizationId: string;
    branchId: string;
  } | null>;

  // mensajes
  abstract createMessage(params: {
    conversationId: string;
    body: string;
    actor: ChatActor;
  }): Promise<{
    id: string;
    body: string;
    createdAt: Date;
  }>;

  abstract getConversationMeta(conversationId: string): Promise<{
    bookingId: string;
    branchId: string;
    organizationId: string;
  } | null>;

  abstract updateLastMessage(conversationId: string, at: Date): Promise<void>;

  // lectura
  abstract markRead(conversationId: string, actor: ChatActor): Promise<void>;

  abstract userBelongsToOrganization(
    userId: string,
    organizationId: string,
  ): Promise<boolean>;

  abstract getConversationBranch(conversationId: string): Promise<string>;

  abstract getInboxForBranch(params: {
    organizationId: string;
    branchId: string;
    userId: string;
    cursor?: string;
    limit: number;
  }): Promise<ChatInboxItem[]>;

  abstract getMessages(params: {
    conversationId: string;
    actor: Extract<ChatActor, { type: 'USER' | 'CLIENT' }>;
    cursor?: string;
    limit: number;
  }): Promise<ChatMessagePage>;

  abstract getConversationAccess(conversationId: string): Promise<{
    branchId: string;
    organizationId: string;
  } | null>;

  abstract getPublicUserIdByClient(clientId: string): Promise<string | null>;

  abstract getClientIdByPublicUser(publicUserId: string): Promise<string[]>;
  abstract getConversationClient(
    conversationId: string,
  ): Promise<string | null>;
  abstract publicOwnsConversation(
    conversationId: string,
    publicUserId: string,
  ): Promise<boolean>;

  abstract getConversationPreviewByBooking(
    bookingId: string,
    userId: string,
  ): Promise<{
    conversationId: string | null;
    lastMessage: {
      body: string;
      createdAt: string;
      from: 'CLIENT' | 'BRANCH' | 'SYSTEM';
    } | null;
    unread: boolean;
  }>;
}

export const CHAT_REPOSITORY = Symbol('CHAT_REPOSITORY');
