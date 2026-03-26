import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import {
  serviceCategories,
  services,
  staffServices,
} from 'src/modules/db/schema';

import { Service } from '../../core/entities/service.entity';

import {
  ServiceRepository,
  CreateServiceInput,
  UpdateServiceInput,
} from '../../core/ports/service.repository';

import * as client from 'src/modules/db/client';

@Injectable()
export class ServicesDrizzleRepository implements ServiceRepository {
  constructor(@Inject('DB') private db: client.DB) {}

  async findAll(branchId: string): Promise<Service[]> {
    const rows = await this.db.query.services.findMany({
      where: eq(services.branchId, branchId),
      with: {
        category: true,
      },
    });

    return rows.map(
      (s) =>
        new Service(
          s.id,
          s.organizationId,
          s.branchId,
          s.categoryId,
          s.name,
          s.description,
          s.durationMin,
          s.priceCents,
          s.notes ?? [],
          s.serviceRules ?? [],
          s.isActive,
        ),
    );
  }

  async findById(id: string): Promise<Service | null> {
    const row = await this.db.query.services.findFirst({
      where: eq(services.id, id),
    });

    if (!row) return null;

    return new Service(
      row.id,
      row.organizationId,
      row.branchId,
      row.categoryId,
      row.name,
      row.description,
      row.durationMin,
      row.priceCents,
      row.notes ?? [],
      row.serviceRules ?? [],
      row.isActive,
    );
  }

  async create(input: CreateServiceInput): Promise<Service> {
    const [row] = await this.db
      .insert(services)
      .values({
        organizationId: input.organizationId,
        branchId: input.branchId,
        categoryId: input.categoryId ?? null,
        name: input.name,
        description: input.description ?? null,
        durationMin: input.durationMin,
        priceCents: input.priceCents ?? null,
      })
      .returning();

    return new Service(
      row.id,
      row.organizationId,
      row.branchId,
      row.categoryId,
      row.name,
      row.description,
      row.durationMin,
      row.priceCents,
      row.notes ?? [],
      row.serviceRules ?? [],
      row.isActive,
    );
  }

  async update(id: string, input: UpdateServiceInput): Promise<Service> {
    const [row] = await this.db
      .update(services)
      .set({
        name: input.name,
        description: input.description,
        durationMin: input.durationMin,
        priceCents: input.priceCents,
        categoryId: input.categoryId,
      })
      .where(eq(services.id, id))
      .returning();

    if (!row) {
      throw new NotFoundException('Service not found');
    }

    return new Service(
      row.id,
      row.organizationId,
      row.branchId,
      row.categoryId,
      row.name,
      row.description,
      row.durationMin,
      row.priceCents,
      row.notes ?? [],
      row.serviceRules ?? [],
      row.isActive,
    );
  }

  async assignToStaff(staffId: string, serviceId: string) {
    await this.db
      .insert(staffServices)
      .values({ staffId, serviceId })
      .onConflictDoNothing();
  }

  async unassignFromStaff(staffId: string, serviceId: string) {
    await this.db
      .delete(staffServices)
      .where(
        and(
          eq(staffServices.staffId, staffId),
          eq(staffServices.serviceId, serviceId),
        ),
      );
  }

  async findWithStaff(branchId: string) {
    return this.db.query.services.findMany({
      where: eq(services.branchId, branchId),
      with: {
        category: true,
        staff: {
          with: {
            staff: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    await this.db.delete(services).where(eq(services.id, id));
  }

  async getNotes(serviceId: string) {
    const service = await this.db.query.services.findFirst({
      where: eq(services.id, serviceId),
    });

    if (!service) {
      throw new BadRequestException('Service not found');
    }

    return service.notes ?? [];
  }

  async addNote(serviceId: string, text: string): Promise<string[]> {
    const service = await this.db.query.services.findFirst({
      where: eq(services.id, serviceId),
    });

    if (!service) {
      throw new BadRequestException('Service not found');
    }

    const updated = [...(service.notes ?? []), text];

    await this.db
      .update(services)
      .set({ notes: updated })
      .where(eq(services.id, serviceId));

    return updated;
  }

  async removeNote(serviceId: string, index: number): Promise<string[]> {
    const service = await this.db.query.services.findFirst({
      where: eq(services.id, serviceId),
    });

    if (!service) {
      throw new BadRequestException('Service not found');
    }

    const updated = (service.notes ?? []).filter((_, i) => i !== index);

    await this.db
      .update(services)
      .set({ notes: updated })
      .where(eq(services.id, serviceId));

    return updated;
  }

  async getRules(serviceId: string) {
    const service = await this.db.query.services.findFirst({
      where: eq(services.id, serviceId),
    });

    if (!service) {
      throw new BadRequestException('Service not found');
    }

    return service.serviceRules ?? [];
  }

  async addRule(serviceId: string, text: string) {
    const service = await this.db.query.services.findFirst({
      where: eq(services.id, serviceId),
    });

    if (!service) {
      throw new BadRequestException('Service not found');
    }

    const updated = [...(service.serviceRules ?? []), text];

    await this.db
      .update(services)
      .set({ serviceRules: updated })
      .where(eq(services.id, serviceId));

    return updated;
  }

  async removeRule(serviceId: string, index: number) {
    const service = await this.db.query.services.findFirst({
      where: eq(services.id, serviceId),
    });

    if (!service) {
      throw new BadRequestException('Service not found');
    }

    const updated = (service.serviceRules ?? []).filter((_, i) => i !== index);

    await this.db
      .update(services)
      .set({ serviceRules: updated })
      .where(eq(services.id, serviceId));

    return updated;
  }

  async getAllCategories() {
    const rows = await this.db
      .select({
        id: serviceCategories.id,
        name: serviceCategories.name,
        icon: serviceCategories.icon,
        hexColor: serviceCategories.colorHex,
      })
      .from(serviceCategories);

    return rows;
  }
}
