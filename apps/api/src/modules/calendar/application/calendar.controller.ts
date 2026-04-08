import {
  Controller,
  Get,
  Inject,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { GetCalendarDayUseCase } from '../core/use-cases/get-calendar-day.use-case';
import { GetCalendarDayDto } from './dto/calendar-day.dto';
import { JwtAuthGuard } from 'src/modules/auth/application/guards/jwt-auth.guard';
import { Roles } from 'src/modules/auth/application/decorators/roles.decorator';
import { RolesGuard } from 'src/modules/auth/application/guards/roles.guard';
import { CalendarSseService } from '../calendar-sse.service';
import { and, eq } from 'drizzle-orm';
import { branches } from 'src/modules/db/schema';
import * as client from 'src/modules/db/client';
import express from 'express';
import { CalendarStreamDto } from './dto/calendar-stream.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly getCalendarDayUseCase: GetCalendarDayUseCase,
    private readonly sseService: CalendarSseService,
    @Inject('DB') private db: client.DB,
  ) {}

  @Get('day')
  getDay(@Query() query: GetCalendarDayDto) {
    return this.getCalendarDayUseCase.execute(query);
  }

  @Get('stream')
  @UseGuards(JwtAuthGuard)
  async stream(
    @Req() req: express.Request,
    @Res() res: express.Response,
    @Query() query: CalendarStreamDto,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = req.user as any;
    const branchId = query.branchId;

    if (!branchId) throw new UnauthorizedException('branchId requerido');

    const branch = await this.db.query.branches.findFirst({
      where: and(
        eq(branches.id, branchId),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        eq(branches.organizationId, user.orgId),
      ),
    });

    if (!branch) throw new UnauthorizedException('branch no válida');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.flushHeaders();
    res.write('retry: 10000\n\n');
    res.write(`event: connected\ndata: ${JSON.stringify({ branchId })}\n\n`);

    this.sseService.addClient(branchId, res);
  }
}
