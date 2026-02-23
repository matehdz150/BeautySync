export type ChatFrom = "CLIENT" | "BRANCH" | "SYSTEM";

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  from: ChatFrom;

  pending?: boolean;
  error?: boolean;
};

export type ChatConversationState = {
  messages: ChatMessage[];
  connected: boolean;
  meta: {
    bookingId?: string;
    branchId?: string;
  };
};

export type ChatState = Record<string, ChatConversationState>;