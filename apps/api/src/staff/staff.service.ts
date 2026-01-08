import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as client from 'src/db/client';
import { branches, staff, staffServices, users } from 'src/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { staffInvites } from 'src/db/schema/staff/staffInvites';
import { mailQueue } from 'src/mail/mail.queue';
import { randomUUID } from 'crypto';
import { resumirHorario } from './util';

@Injectable()
export class StaffService {
  constructor(@Inject('DB') private db: client.DB) {}

  findAll() {
    return this.db.select().from(staff);
  }

  async findOne(id: string) {
    const person = await this.db.query.staff.findFirst({
      where: eq(staff.id, id),
    });

    if (!person) throw new NotFoundException('Staff not found');
    return person;
  }

  async create(data: CreateStaffDto) {
    const exists = await this.db.query.staff.findFirst({
      where: eq(staff.email, data.email),
    });

    if (exists)
      throw new BadRequestException('Email already registered as staff');
    const [created] = await this.db
      .insert(staff)
      .values({
        branchId: data.branchId,
        name: data.name,
        email: data.email,
        avatarUrl: data.avatarUrl ?? null,

        // 🔒 siempre pendiente al registrar
        status: 'pending',
      })
      .returning();

    return created;
  }

  async update(id: string, data: UpdateStaffDto) {
    const [updated] = await this.db
      .update(staff)
      .set(data)
      .where(eq(staff.id, id))
      .returning();

    if (!updated) throw new NotFoundException('Staff not found');
    return updated;
  }

  async remove(id: string) {
    await this.db.delete(staff).where(eq(staff.id, id));
    return { success: true };
  }

  async inviteStaff(
    email: string,
    staffId: string,
    role: 'staff' | 'manager',
    invitedByUser: any,
  ) {
    return this.db.transaction(async (tx) => {
      const staffRow = await tx.query.staff.findFirst({
        where: eq(staff.id, staffId),
      });

      if (!staffRow) throw new NotFoundException('Staff not found');

      if (!staffRow.email) throw new BadRequestException('Staff has no email');

      if (staffRow.email !== email)
        throw new BadRequestException(
          'Email does not match staff record. Update staff email first.',
        );

      if (staffRow.userId)
        throw new BadRequestException('Staff already has a linked user');

      // 🔥 Cargar branch para validar org
      const branchRow = await tx.query.branches.findFirst({
        where: eq(branches.id, staffRow.branchId),
      });

      if (!branchRow) throw new NotFoundException('Branch not found');

      // 🔐 Seguridad: owner debe pertenecer a misma org
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (invitedByUser.orgId !== branchRow.organizationId)
        throw new ForbiddenException('Not allowed');

      const existingUser = await tx.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser)
        throw new BadRequestException('A user already exists with this email');

      // ❌ invalidar invites viejas
      await tx
        .update(staffInvites)
        .set({ expiresAt: new Date() })
        .where(eq(staffInvites.staffId, staffId));

      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await tx.insert(staffInvites).values({
        email,
        staffId,
        role,
        token,
        expiresAt,
      });

      await tx
        .update(staff)
        .set({ status: 'pending' })
        .where(eq(staff.id, staffId));

      await mailQueue.add('invite-staff', {
        to: email,
        inviteLink: `http://localhost:3000/accept-invite?token=${token}`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        invitedBy: invitedByUser.name ?? invitedByUser.email,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        organization: invitedByUser.orgName ?? 'BeautySync',
        branch: 'Sucursal',
        role,
      });

      return { ok: true };
    });
  }

  async reinviteStaff(staffId: string) {
    return this.db.transaction(async (tx) => {
      // 1️⃣ cargar staff
      const staffRow = await tx.query.staff.findFirst({
        where: eq(staff.id, staffId),
      });

      if (!staffRow) throw new NotFoundException('Staff not found');

      if (!staffRow.email) throw new BadRequestException('Staff has no email');

      if (staffRow.userId)
        throw new BadRequestException('Staff already accepted invite');

      // 2️⃣ cerrar invitaciones previas
      await tx
        .update(staffInvites)
        .set({ expiresAt: new Date() })
        .where(eq(staffInvites.staffId, staffId));

      // 3️⃣ generar una nueva
      const token = randomUUID();

      const lastInvite = await tx.query.staffInvites.findFirst({
        where: eq(staffInvites.staffId, staffId),

        orderBy: desc(staffInvites.createdAt),
      });

      const [invite] = await tx
        .insert(staffInvites)
        .values({
          email: staffRow.email,
          staffId,
          role: lastInvite?.role ?? 'staff',
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
        .returning();

      // 4️⃣ enviar correo
      await mailQueue.add('invite-staff', {
        to: staffRow.email,
        inviteLink: `http://localhost:3000/accept-invite?token=${token}`,
        invitedBy: 'System',
        organization: 'BeautySync',
        branch: 'Sucursal',
        role: invite.role,
      });

      return { ok: true };
    });
  }

  async findByBranch(branchId: string, user: any) {
    const branchRow = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branchRow) throw new NotFoundException('Branch not found');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (branchRow.organizationId !== user.orgId) {
      throw new ForbiddenException('You cannot access this branch');
    }

    const rows = await this.db.query.staff.findMany({
      where: eq(staff.branchId, branchId),
      with: {
        schedules: true,

        services: {
          with: {
            service: {
              with: {
                category: true, // 👈🔥 CLAVE FINAL
              },
            },
          },
        },
      },
    });

    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      avatarUrl: s.avatarUrl,
      status: s.status,
      schedule: resumirHorario(s.schedules),

      services: s.services.map((ss) => ({
        id: ss.service.id,
        name: ss.service.name,
        durationMin: ss.service.durationMin,
        priceCents: ss.service.priceCents,

        category: ss.service.category?.name ?? null,
        categoryColor: ss.service.category?.colorHex ?? null,
        categoryIcon: ss.service.category?.icon ?? null,
      })),

      rating: 5,
      totalClients: 0,
      appointmentsToday: 0,
    }));
  }

  async findFiltered(params: {
    branchId: string;
    serviceId?: string;
    user: any;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { branchId, serviceId, user } = params;

    // 🔐 valida pertenencia a misma org (igualito a tu findByBranch)
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branch) throw new NotFoundException('Branch not found');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (branch.organizationId !== user.orgId)
      throw new ForbiddenException('Forbidden');

    // 👉 sin serviceId → todo el staff
    if (!serviceId) {
      return this.db.query.staff.findMany({
        where: and(eq(staff.branchId, branchId), eq(staff.isActive, true)),
      });
    }

    // 👉 con serviceId → filtrar por staffServices
    return this.db
      .select({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        avatarUrl: staff.avatarUrl,
        status: staff.status,
      })
      .from(staff)
      .innerJoin(staffServices, eq(staff.id, staffServices.staffId))
      .where(
        and(
          eq(staff.branchId, branchId),
          eq(staff.isActive, true),
          eq(staffServices.serviceId, serviceId),
        ),
      );
  }
}
