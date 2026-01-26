import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import * as client from '../../db/client';
import { branches, serviceCategories, services, staff } from '../../db/schema';

import { staffServices } from 'src/modules/db/schema';

@Injectable()
export class ServicesPublicService {
  constructor(@Inject('DB') private db: client.DB) {}

  async getServicesByBranchSlug(slug: string) {
    if (!slug) throw new NotFoundException('Branch not found');

    // 1️⃣ Buscar branch
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    // 2️⃣ Servicios públicos activos
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

    // 3️⃣ Normalizar categoría null
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
    // 1️⃣ Branch
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    // 2️⃣ Service belongs to branch
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

    // 3️⃣ Staff elegible
    const rows = await this.db
      .select({
        id: staff.id,
        name: staff.name,
        avatarUrl: staff.avatarUrl,
      })
      .from(staffServices)
      .innerJoin(
        staff,
        and(
          eq(staff.id, staffServices.staffId),
          eq(staff.branchId, branch.id),
          eq(staff.isActive, true),
        ),
      )
      .where(eq(staffServices.serviceId, serviceId))
      .orderBy(staff.name);

    return rows;
  }
}
