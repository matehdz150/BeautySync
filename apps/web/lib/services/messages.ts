import { api } from "./api";

export type ConversationPreview = {
  conversationId: string | null;
  lastMessage: {
    body: string;
    createdAt: string;
    from: "CLIENT" | "BRANCH" | "SYSTEM";
  } | null;
  unread: boolean;
};

export async function getConversationByBooking(
  bookingId: string
): Promise<ConversationPreview> {
  return api(
    `/manager/chat/booking/${bookingId}/conversation`
  );
}