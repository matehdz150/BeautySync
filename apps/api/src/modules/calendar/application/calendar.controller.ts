import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { GetCalendarDayUseCase } from '../core/use-cases/get-calendar-day.use-case';
import { GetCalendarWeekSummaryUseCase } from '../core/use-cases/get-calendar-week-summary.use-case';
import { GetCalendarDayDto } from './dto/calendar-day.dto';
import { GetCalendarWeekSummaryDto } from './dto/calendar-week-summary.dto';
import { JwtAuthGuard } from 'src/modules/auth/application/guards/jwt-auth.guard';
import { Roles } from 'src/modules/auth/application/decorators/roles.decorator';
import { RolesGuard } from 'src/modules/auth/application/guards/roles.guard';
import { CalendarSseService } from '../calendar-sse.service';
import express from 'express';
import { CalendarStreamDto } from './dto/calendar-stream.dto';
import { trackAction } from 'src/modules/metrics/action-metrics';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly getCalendarDayUseCase: GetCalendarDayUseCase,
    private readonly getCalendarWeekSummaryUseCase: GetCalendarWeekSummaryUseCase,
    private readonly sseService: CalendarSseService,
  ) {}

  @Get('day')
  async getDay(@Query() query: GetCalendarDayDto) {
    return trackAction('VIEW_CALENDAR', () =>
      this.getCalendarDayUseCase.execute(query),
    );
  }

  @Get('week-summary')
  async getWeekSummary(@Query() query: GetCalendarWeekSummaryDto) {
    return trackAction('VIEW_CALENDAR', () =>
      this.getCalendarWeekSummaryUseCase.execute(query),
    );
  }

  @Get('stream')
  @UseGuards(JwtAuthGuard)
  async stream(
    @Req() req: express.Request,
    @Res() res: express.Response,
    @Query() query: CalendarStreamDto,
  ) {
    const user = req.user as AuthenticatedUser | undefined;
    const branchId = query.branchId;

    if (!branchId) throw new UnauthorizedException('branchId requerido');
    if (!user?.orgId) throw new UnauthorizedException('organization requerida');

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
