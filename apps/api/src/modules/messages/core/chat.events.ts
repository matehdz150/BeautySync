import { ChatActor } from './chat.types';

export type ChatEvent =
  | {
      type: 'CONVERSATION_CREATED';
      conversationId: string;
      bookingId: string;
      branchId: string;
    }
  | {
      type: 'MESSAGE_SENT';
      conversationId: string;
      bookingId: string;
      messageId: string;
      actor: ChatActor;
      preview: string; // para inbox sin query
      createdAt: string;
      branchId: string;
    }
  | {
      type: 'CONVERSATION_READ';
      conversationId: string;
      actor: ChatActor;
      readAt: string;
      branchId: string;
    };
