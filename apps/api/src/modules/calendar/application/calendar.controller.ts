import { Controller, Get, Query } from '@nestjs/common';
import { GetCalendarDayUseCase } from '../core/use-cases/get-calendar-day.use-case';
import { GetCalendarDayDto } from './dto/calendar-day.dto';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly getCalendarDayUseCase: GetCalendarDayUseCase) {}

  @Get('day')
  getDay(@Query() query: GetCalendarDayDto) {
    return this.getCalendarDayUseCase.execute(query);
  }
}
