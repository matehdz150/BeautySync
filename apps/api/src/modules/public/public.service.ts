import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as client from 'src/modules/db/client';
import { publicUsers } from 'src/modules/db/schema';
import { PublicBookingJobsService } from 'src/modules/queues/booking/public-booking-job.service';

@Injectable()
export class PublicService {
  constructor(
    @Inject('DB') private db: client.DB,
    private readonly publicBookingJobsService: PublicBookingJobsService,
  ) {}

  async setPhone(params: { publicUserId: string; phoneE164: string }) {
    const { publicUserId, phoneE164 } = params;

    if (!phoneE164 || !phoneE164.startsWith('+')) {
      throw new BadRequestException(
        'phoneE164 must be in E.164 format, example: +5213312345678',
      );
    }

    await this.db
      .update(publicUsers)
      .set({ phoneE164 })
      .where(eq(publicUsers.id, publicUserId));

    return { ok: true };
  }
}
