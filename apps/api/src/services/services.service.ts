import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { services, staff, staffServices } from 'src/db/schema';
import * as client from 'src/db/client';
import { and, eq } from 'drizzle-orm';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(@Inject('DB') private db: client.DB) {}

  findAll(branchId: string) {
    return this.db
      .select()
      .from(services)
      .where(eq(services.branchId, branchId));
  }

  async findOne(id: string) {
    const row = await this.db.query.services.findFirst({
      where: eq(services.id, id),
      with: {
        staff: {
          with: {
            staff: true, // 👈 incluye datos del staff real
          },
        },
        category: true, // opcional pero útil
      },
    });

    if (!row) throw new BadRequestException('Service not found');
    return row;
  }

  async update(id: string, dto: UpdateServiceDto) {
    const [row] = await this.db
      .update(services)
      .set(dto)
      .where(eq(services.id, id))
      .returning();

    if (!row) throw new BadRequestException('Service not found');
    return row;
  }

  async remove(id: string) {
    await this.db.delete(services).where(eq(services.id, id));
    return { ok: true };
  }

  async create(dto: CreateServiceDto) {
    const [service] = await this.db
      .insert(services)
      .values({
        ...dto,
        notes: dto.notes ?? [],
        serviceRules: dto.serviceRules ?? [],
      })
      .returning();

    return service;
  }

  async assignToStaff(staffId: string, serviceId: string) {
    await this.db
      .insert(staffServices)
      .values({ staffId, serviceId })
      .onConflictDoNothing();

    return { success: true };
  }

  async getByBranch(branchId: string) {
    return this.db.query.services.findMany({
      where: eq(services.branchId, branchId),
      with: {
        category: true,
        staff: { with: { staff: true } },
      },
    });
  }

  async unassignServiceFromStaff(staffId: string, serviceId: string) {
    await this.db
      .delete(staffServices)
      .where(
        and(
          eq(staffServices.staffId, staffId),
          eq(staffServices.serviceId, serviceId),
        ),
      );

    return { success: true };
  }

  async removeService(serviceId: string) {
    await this.db.delete(services).where(eq(services.id, serviceId));
    return { success: true };
  }

  /* =========================
        📌 NOTES
  ========================= */

  async getNotes(serviceId: string) {
    const service = await this.findOne(serviceId);
    return service.notes ?? [];
  }

  async addNote(serviceId: string, text: string) {
    const service = await this.findOne(serviceId);

    const updated = [...(service.notes ?? []), text];

    await this.db
      .update(services)
      .set({ notes: updated })
      .where(eq(services.id, serviceId));

    return { success: true, notes: updated };
  }

  async removeNote(serviceId: string, index: number) {
    const service = await this.findOne(serviceId);

    const updated = (service.notes ?? []).filter((_, i) => i !== index);

    await this.db
      .update(services)
      .set({ notes: updated })
      .where(eq(services.id, serviceId));

    return { success: true, notes: updated };
  }

  /* =========================
       📌 SERVICE RULES
  ========================= */

  async getRules(serviceId: string) {
    const service = await this.findOne(serviceId);
    return service.serviceRules ?? [];
  }

  async addRule(serviceId: string, text: string) {
    const service = await this.findOne(serviceId);

    const updated = [...(service.serviceRules ?? []), text];

    await this.db
      .update(services)
      .set({ serviceRules: updated })
      .where(eq(services.id, serviceId));

    return { success: true, serviceRules: updated };
  }

  async removeRule(serviceId: string, index: number) {
    const service = await this.findOne(serviceId);

    const updated = (service.serviceRules ?? []).filter((_, i) => i !== index);

    await this.db
      .update(services)
      .set({ serviceRules: updated })
      .where(eq(services.id, serviceId));

    return { success: true, serviceRules: updated };
  }
}
