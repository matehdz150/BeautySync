import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as client from 'src/modules/db/client';

import {
  branches,
  staff,
  staffInvites,
  staffServices,
  users,
} from 'src/modules/db/schema';

import { and, desc, eq } from 'drizzle-orm';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

import {
  CreateStaffInput,
  StaffRepository,
  UpdateStaffInput,
} from '../../core/ports/staff.repository';

import { resumirHorario } from '../../util';
import { Staff, StaffDetails } from '../../core/entities/staff.entity';
import { mailQueue } from 'src/modules/queues/mail/mail.queue';
import { randomUUID } from 'crypto';

@Injectable()
export class StaffDrizzleRepository implements StaffRepository {
  constructor(@Inject('DB') private db: client.DB) {}

  async findAll() {
    return this.db.select().from(staff);
  }

  async findById(id: string): Promise<StaffDetails | null> {
    const person = await this.db.query.staff.findFirst({
      where: eq(staff.id, id),
      with: {
        schedules: true,
        services: {
          with: {
            service: true,
          },
        },
      },
    });

    if (!person) return null;

    return {
      id: person.id,
      name: person.name,
      email: person.email,
      avatarUrl: person.avatarUrl,
      jobRole: person.jobRole,

      schedules: person.schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })),

      services: person.services.map((ss) => ss.serviceId),
    };
  }

  async create(data: CreateStaffInput): Promise<Staff> {
    const exists = await this.db.query.staff.findFirst({
      where: eq(staff.email, data.email),
    });

    if (exists) {
      throw new BadRequestException('Email already registered as staff');
    }

    const [created] = await this.db
      .insert(staff)
      .values({
        branchId: data.branchId,
        name: data.name,
        email: data.email,
        avatarUrl: data.avatarUrl ?? null,
        jobRole: data.jobRole ?? null,
        status: 'pending',
      })
      .returning();

    return new Staff(
      created.id,
      created.branchId,
      created.userId,
      created.name,
      created.email,
      created.avatarUrl,
      created.jobRole,
      created.status,
      created.isActive,
    );
  }

  async delete(id: string): Promise<Staff> {
    const [deleted] = await this.db
      .delete(staff)
      .where(eq(staff.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException('Staff not found');
    }

    return new Staff(
      deleted.id,
      deleted.branchId,
      deleted.userId,
      deleted.name,
      deleted.email,
      deleted.avatarUrl,
      deleted.jobRole,
      deleted.status,
      deleted.isActive,
    );
  }

  async findByBranch(branchId: string, user: AuthenticatedUser) {
    const branchRow = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branchRow) {
      throw new NotFoundException('Branch not found');
    }

    if (!user.belongsToOrg(branchRow.organizationId)) {
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
                category: true,
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
      jobRole: s.jobRole,
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
  async update(
    id: string,
    data: UpdateStaffInput,
    user: AuthenticatedUser,
  ): Promise<Staff> {
    const staffRow = await this.db.query.staff.findFirst({
      where: eq(staff.id, id),
    });

    if (!staffRow) {
      throw new NotFoundException('Staff not found');
    }

    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, staffRow.branchId),
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('Not allowed');
    }

    const [updated] = await this.db
      .update(staff)
      .set(data)
      .where(eq(staff.id, id))
      .returning();

    return new Staff(
      updated.id,
      updated.branchId,
      updated.userId,
      updated.name,
      updated.email,
      updated.avatarUrl,
      updated.jobRole,
      updated.status,
      updated.isActive,
    );
  }

  async findFiltered(params: {
    branchId: string;
    serviceId?: string;
    user: AuthenticatedUser;
  }) {
    const { branchId, serviceId, user } = params;

    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('Forbidden');
    }

    if (!serviceId) {
      return this.db.query.staff.findMany({
        where: and(eq(staff.branchId, branchId), eq(staff.isActive, true)),
      });
    }

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

  async inviteStaff(
    email: string,
    staffId: string,
    role: 'staff' | 'manager',
    user: AuthenticatedUser,
  ): Promise<{ ok: boolean }> {
    return this.db.transaction(async (tx) => {
      const staffRow = await tx.query.staff.findFirst({
        where: eq(staff.id, staffId),
      });

      if (!staffRow) {
        throw new NotFoundException('Staff not found');
      }

      if (!staffRow.email) {
        throw new BadRequestException('Staff has no email');
      }

      if (staffRow.email !== email) {
        throw new BadRequestException(
          'Email does not match staff record. Update staff email first.',
        );
      }

      if (staffRow.userId) {
        throw new BadRequestException('Staff already has a linked user');
      }

      const branchRow = await tx.query.branches.findFirst({
        where: eq(branches.id, staffRow.branchId),
      });

      if (!branchRow) {
        throw new NotFoundException('Branch not found');
      }

      if (
        !branchRow.organizationId ||
        !user.belongsToOrg(branchRow.organizationId)
      ) {
        throw new ForbiddenException('Not allowed');
      }

      const existingUser = await tx.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        throw new BadRequestException('A user already exists with this email');
      }

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
        invitedBy: user.id,
        organization: 'BeautySync',
        branch: 'Sucursal',
        role,
      });

      return { ok: true };
    });
  }

  async reinviteStaff(staffId: string): Promise<{ ok: boolean }> {
    return this.db.transaction(async (tx) => {
      const staffRow = await tx.query.staff.findFirst({
        where: eq(staff.id, staffId),
      });

      if (!staffRow) {
        throw new NotFoundException('Staff not found');
      }

      if (!staffRow.email) {
        throw new BadRequestException('Staff has no email');
      }

      if (staffRow.userId) {
        throw new BadRequestException('Staff already accepted invite');
      }

      await tx
        .update(staffInvites)
        .set({ expiresAt: new Date() })
        .where(eq(staffInvites.staffId, staffId));

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
}
