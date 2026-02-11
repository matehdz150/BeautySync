import { pgEnum } from 'drizzle-orm/pg-core';

export const conversationStatusEnum = pgEnum('conversation_status', [
  'ACTIVE',
  'ARCHIVED',
]);

export const messageSenderTypeEnum = pgEnum('message_sender_type', [
  'CLIENT',
  'BUSINESS',
]);

export const notificationTargetEnum = pgEnum('notification_target', [
  'MANAGER',
  'CLIENT',
]);

export const notificationKindEnum = pgEnum('notification_kind', [
  'BOOKING_CREATED',
  'BOOKING_CANCELLED',
  'BOOKING_RESCHEDULED',
  'CHAT_MESSAGE',
  'REVIEW_CREATED',
]);
