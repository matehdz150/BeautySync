// QUIÉN está actuando
export type ChatActor =
  | { type: 'USER'; userId: string } // staff / manager
  | { type: 'CLIENT'; clientId: string } // cliente real
  | { type: 'SYSTEM' };

// Entrada principal
export interface SendMessageInput {
  bookingId: string;
  body: string;
  actor: ChatActor;
}

// Resultado de enviar mensaje
export interface SendMessageResult {
  conversationId: string;
  messageId: string;
  created: boolean; // si la conversación fue creada
}

export interface ChatInboxItem {
  conversationId: string;
  bookingId: string;

  client: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };

  lastMessage: {
    body: string | null;
    createdAt: string;
    from: 'CLIENT' | 'BRANCH' | 'SYSTEM';
  } | null;

  unread: boolean;
}

export type ChatInboxRow = {
  conversationId: string;
  bookingId: string;

  clientId: string;
  clientName: string | null;
  clientAvatar: string | null;

  lastBody: string | null;
  lastCreatedAt: Date | null;
  lastFrom: 'CLIENT' | 'BRANCH' | 'SYSTEM' | null;

  unread: boolean | null;
};

export interface ChatMessage {
  id: string;
  body: string;
  createdAt: string;

  from: 'CLIENT' | 'BRANCH' | 'SYSTEM';

  senderUserId?: string | null;
  senderClientId?: string | null;
}

export interface ChatMessagePage {
  items: ChatMessage[];
  nextCursor: string | null;
}
