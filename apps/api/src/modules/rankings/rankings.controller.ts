import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';

import { RankingsService } from './rankings.service';

import { PublicAuthGuard } from '../auth/application/guards/public-auth.guard';
import { PublicUser } from '../auth/application/decorators/public-user.decorator';
import * as publicUserDecorator from '../auth/application/decorators/public-user.decorator';

@Controller('rankings')
@UseGuards(PublicAuthGuard)
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Post(':bookingId/rating')
  async rateBooking(
    @Param('bookingId') bookingId: string,
    @Body()
    body: {
      rating: number;
      comment?: string;
    },
    @PublicUser() user: publicUserDecorator.PublicSession,
  ) {
    return this.rankingsService.createBookingRating({
      bookingId,
      publicUserId: user.publicUserId,
      rating: body.rating,
      comment: body.comment,
    });
  }
}
