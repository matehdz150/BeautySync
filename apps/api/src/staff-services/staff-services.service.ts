import { Inject, Injectable } from '@nestjs/common';
import { staffServices } from 'src/db/schema';
import * as client from 'src/db/client';
import { eq, and } from 'drizzle-orm';
import { LinkStaffServiceDto } from './dto/create-staff-service.dto';

@Injectable()
export class StaffServicesService {
  constructor(@Inject('DB') private db: client.DB) {}

  async link(dto: LinkStaffServiceDto) {
    const [row] = await this.db.insert(staffServices).values(dto).returning();
    return row;
  }

  async unlink(dto: LinkStaffServiceDto) {
    await this.db
      .delete(staffServices)
      .where(
        and(
          eq(staffServices.staffId, dto.staffId),
          eq(staffServices.serviceId, dto.serviceId),
        ),
      );

    return { ok: true };
  }
}
