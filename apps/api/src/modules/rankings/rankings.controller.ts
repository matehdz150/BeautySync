import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { PublicAuthGuard } from '../auth/public/public-auth.guard';
import * as publicUserDecorator from '../auth/public/public-user.decorator';

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
    @publicUserDecorator.PublicUser()
    user: publicUserDecorator.PublicUserSession,
  ) {
    return this.rankingsService.createBookingRating({
      bookingId,
      publicUserId: user.publicUserId,
      rating: body.rating,
      comment: body.comment,
    });
  }
}
