// dto/create-notification.dto.ts
import { IsEnum, IsOptional, IsUUID, IsObject } from 'class-validator';
import {
  notificationKindEnum,
  notificationTargetEnum,
} from 'src/modules/db/schema';

/**
 * Extraemos los valores reales del enum
 * (esto es CLAVE para que TS y class-validator coincidan)
 */
type NotificationTarget = (typeof notificationTargetEnum.enumValues)[number];

type NotificationKind = (typeof notificationKindEnum.enumValues)[number];

export class CreateNotificationDto {
  @IsEnum(notificationTargetEnum.enumValues)
  target: NotificationTarget; // 'CLIENT' | 'MANAGER'

  @IsEnum(notificationKindEnum.enumValues)
  kind: NotificationKind; // enum real, NO string

  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsUUID()
  branchId: string;

  @IsOptional()
  @IsUUID()
  recipientUserId?: string; // requerido si target === 'MANAGER'

  @IsOptional()
  @IsUUID()
  recipientClientId?: string; // requerido si target === 'CLIENT'

  @IsObject()
  payload: Record<string, any>;
}
