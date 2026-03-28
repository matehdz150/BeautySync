import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServicePublicRepository } from 'src/modules/services/core/ports/service-public.repository';
import * as client from 'src/modules/db/client';
import { services } from 'src/modules/db/schema/services/service';
import { serviceCategories } from 'src/modules/db/schema/services/serviceCategories';
import { eq, and } from 'drizzle-orm';
import { branches } from 'src/modules/db/schema/branches/branches';
import { staff } from 'src/modules/db/schema/staff/staff';
import { staffServices } from 'src/modules/db/schema/services/staffServices';

@Injectable()
export class ServicesPublicDrizzleRepository implements ServicePublicRepository {
  constructor(@Inject('DB') private db: client.DB) {}
  async getServicesByBranchSlug(slug: string) {
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    const rows = await this.db
      .select({
        id: services.id,
        name: services.name,
        durationMin: services.durationMin,
        priceCents: services.priceCents,

        category: {
          id: serviceCategories.id,
          name: serviceCategories.name,
          icon: serviceCategories.icon,
          hexColor: serviceCategories.colorHex,
        },
      })
      .from(services)
      .leftJoin(
        serviceCategories,
        eq(serviceCategories.id, services.categoryId),
      )
      .where(and(eq(services.branchId, branch.id), eq(services.isActive, true)))
      .orderBy(services.name);

    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      durationMin: s.durationMin,
      priceCents: s.priceCents,
      category: s.category?.id ? s.category : null,
    }));
  }

  async getStaffForService({
    slug,
    serviceId,
  }: {
    slug: string;
    serviceId: string;
  }) {
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    const service = await this.db.query.services.findFirst({
      where: and(
        eq(services.id, serviceId),
        eq(services.branchId, branch.id),
        eq(services.isActive, true),
      ),
    });

    if (!service) {
      throw new BadRequestException('Invalid service for this branch');
    }

    const rows = await this.db
      .select({
        id: staff.id,
        name: staff.name,
        avatarUrl: staff.avatarUrl,
      })
      .from(staffServices)
      .innerJoin(staff, eq(staff.id, staffServices.staffId))
      .where(
        and(
          eq(staffServices.serviceId, serviceId),
          eq(staff.branchId, branch.id),
          eq(staff.isActive, true), // 🔥 AQUÍ TAMBIÉN
        ),
      )
      .orderBy(staff.name);

    return rows;
  }
}
