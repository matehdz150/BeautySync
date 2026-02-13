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
  Inject,
} from '@nestjs/common';
import express from 'express';

import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

import { JwtAuthGuard } from '../auth/manager/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/manager/guards/roles.guard';
import { Roles } from '../auth/manager/roles.decorator';
import { NotificationsSseService } from './notifications-sse.service';
import { and, eq } from 'drizzle-orm';
import { branches } from '../db/schema';
import * as client from 'src/modules/db/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
    private readonly sseService: NotificationsSseService,
    @Inject('DB') private db: client.DB,
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = req.user as any;

    if (!branchId) throw new UnauthorizedException('branchId requerido');

    // 🔐 Validar que la branch pertenece a su organización
    const branch = await this.db.query.branches.findFirst({
      where: and(
        eq(branches.id, branchId),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        eq(branches.organizationId, user.orgId),
      ),
    });

    if (!branch) throw new UnauthorizedException('branch no válida');

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

  @Get('item/:id')
  getListItem(
    @Param('id') notificationId: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.service.getNotificationListItem(notificationId, req.user.id);
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

  @Get(':id')
  getDetail(
    @Param('id') notificationId: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.service.getNotificationDetail(notificationId, req.user.id);
  }
}
