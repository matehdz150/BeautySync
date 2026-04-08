/* eslint-disable @typescript-eslint/no-unsafe-call */
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
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import express from 'express';

import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

import { JwtAuthGuard } from '../auth/application/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/application/guards/roles.guard';
import { Roles } from '../auth/application/decorators/roles.decorator';
import { NotificationsSseService } from './notifications-sse.service';
import { AuthenticatedUser } from '../auth/core/entities/authenticatedUser.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
    private readonly sseService: NotificationsSseService,
  ) {}

  /**
   * 🔔 Crear notificación (uso interno / sistema)
   */
  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.service.create(dto);
  }

  @Get('stream')
  @UseGuards(JwtAuthGuard)
  async stream(
    @Req() req: express.Request,
    @Res() res: express.Response,
    @Query('branchId') branchId?: string,
  ) {
    const user = req.user as AuthenticatedUser | undefined;

    if (!branchId) throw new UnauthorizedException('branchId requerido');
    if (!user?.orgId) throw new UnauthorizedException('organization requerida');

    // 🔥 headers SSE correctos
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.flushHeaders();
    res.write('retry: 10000\n\n');

    // handshake inicial
    res.write(`event: connected\ndata: ${JSON.stringify({ branchId })}\n\n`);

    this.sseService.addClient(branchId, res);
  }

  /**
   * 📥 Obtener notificaciones del manager autenticado
   */
  @Get()
  findMine(
    @Req() req: { user: AuthenticatedUser },
    @Query('unread') unread?: string,
    @Query('kind') kind?: 'ALL' | 'BOOKING' | 'CHAT',
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findForManager(req.user.orgId, {
      unread: unread === 'true',
      kind,
      cursor,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('item/:id')
  getListItem(
    @Param('id') notificationId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.service.getNotificationListItem(notificationId, req.user.orgId);
  }

  /**
   * ✅ Marcar UNA como leída
   */
  @Patch(':id/read')
  markAsRead(
    @Param('id') notificationId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.service.markAsRead(notificationId, req.user.orgId);
  }

  /**
   * ✅ Marcar TODAS como leídas
   */
  @Patch('read-all')
  markAllAsRead(@Req() req: { user: { id: string } }) {
    return this.service.markAllAsReadForUser(req.user.id);
  }

  @Get(':id')
  getDetail(
    @Param('id') notificationId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.service.getNotificationDetail(notificationId, req.user.orgId);
  }
}
