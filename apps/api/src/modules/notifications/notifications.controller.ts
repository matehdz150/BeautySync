import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

import { JwtAuthGuard } from '../auth/manager/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/manager/guards/roles.guard';
import { Roles } from '../auth/manager/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  /**
   * 🔔 Crear notificación (uso interno / sistema)
   */
  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.service.create(dto);
  }

  /**
   * 📥 Obtener notificaciones del manager autenticado
   */
  @Get()
  findMine(
    @Req() req: { user: { id: string } },
    @Query('unread') unread?: string,
    @Query('kind') kind?: 'ALL' | 'BOOKING' | 'CHAT',
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findForManager(req.user.id, {
      unread: unread === 'true',
      kind,
      cursor,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * ✅ Marcar UNA como leída
   */
  @Patch(':id/read')
  markAsRead(
    @Param('id') notificationId: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.service.markAsRead(notificationId, req.user.id);
  }

  /**
   * ✅ Marcar TODAS como leídas
   */
  @Patch('read-all')
  markAllAsRead(@Req() req: { user: { id: string } }) {
    return this.service.markAllAsReadForUser(req.user.id);
  }
}
