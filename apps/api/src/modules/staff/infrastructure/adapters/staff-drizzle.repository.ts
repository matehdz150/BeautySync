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
  organizations,
  staff,
  staffInvites,
  staffServices,
  users,
} from 'src/modules/db/schema';

import { and, desc, eq, sql } from 'drizzle-orm';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

import {
  CreateStaffInput,
  StaffInviteInfo,
  StaffRepository,
  UpdateStaffInput,
} from '../../core/ports/staff.repository';

import { resumirHorario } from '../../util';
import { Staff, StaffDetails } from '../../core/entities/staff.entity';
import { mailQueue } from 'src/modules/queues/mail/mail.queue';
import { randomUUID } from 'crypto';

function toIso(value: unknown): string {
  if (!value) return new Date().toISOString();

  if (value instanceof Date) return value.toISOString();

  // postgres-js devuelve string
  return new Date(value as string).toISOString();
}

function parseJsonArray<T>(value: unknown): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T[];
    } catch {
      return [];
    }
  }

  return [];
}

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
      userId: person.userId,
      branchId: person.branchId,
      isActive: person.isActive,

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
    const [updated] = await this.db
      .update(staff)
      .set({
        isActive: false,
        status: 'disabled',
      })
      .where(eq(staff.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException('Staff not found');
    }

    if (!staff.isActive) {
      throw new BadRequestException('Staff already disabled');
    }

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

  async findByBranch(branchId: string, user: AuthenticatedUser) {
    const branchRow = await this.db.query.branches.findFirst({
      columns: {
        id: true,
        organizationId: true,
      },
      where: eq(branches.id, branchId),
    });

    if (!branchRow) {
      throw new NotFoundException('Branch not found');
    }

    if (!user.belongsToOrg(branchRow.organizationId)) {
      throw new ForbiddenException('You cannot access this branch');
    }

    const rows = await this.db.execute<{
      id: string;
      name: string;
      email: string | null;
      avatarUrl: string | null;
      status: 'pending' | 'active' | 'disabled';
      jobRole: string | null;
      isActive: boolean;
      rating: number | null;
      schedules: unknown;
      services: unknown;
    }>(sql`
      SELECT
        s.id AS "id",
        s.name AS "name",
        s.email AS "email",
        s.avatar_url AS "avatarUrl",
        s.status AS "status",
        s."jobRole" AS "jobRole",
        s.is_active AS "isActive",
        COALESCE(r.avg_rating, 0)::float AS "rating",
        COALESCE(sch.items, '[]'::json) AS "schedules",
        COALESCE(srv.items, '[]'::json) AS "services"
      FROM staff s
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', ss.id,
            'dayOfWeek', ss.day_of_week,
            'startTime', ss.start_time,
            'endTime', ss.end_time
          )
          ORDER BY ss.day_of_week, ss.start_time
        ) AS items
        FROM staff_schedules ss
        WHERE ss.staff_id = s.id
      ) sch ON TRUE
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', sv.id,
            'name', sv.name,
            'durationMin', sv.duration_min,
            'priceCents', sv.price_cents,
            'category', sc.name,
            'categoryColor', sc.color_hex,
            'categoryIcon', sc.icon
          )
          ORDER BY sv.name
        ) AS items
        FROM staff_services ssv
        JOIN services sv
          ON sv.id = ssv.service_id
        LEFT JOIN service_categories sc
          ON sc.id = sv.category_id
        WHERE ssv.staff_id = s.id
      ) srv ON TRUE
      LEFT JOIN LATERAL (
        SELECT AVG(pbr.rating)::float AS avg_rating
        FROM public_booking_rating_staff prs
        JOIN public_booking_ratings pbr
          ON pbr.id = prs.rating_id
        WHERE prs.staff_id = s.id
      ) r ON TRUE
      WHERE s.branch_id = ${branchId}
        AND s.is_active = TRUE
      ORDER BY s.name ASC
    `);

    return rows.map((row) => {
      const schedules = parseJsonArray<{
        id: number;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
      }>(row.schedules);
      const services = parseJsonArray<{
        id: string;
        name: string;
        durationMin: number;
        priceCents?: number | null;
        category?: string | null;
        categoryColor?: string | null;
        categoryIcon?: string | null;
      }>(row.services);

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        avatarUrl: row.avatarUrl,
        status: row.status,
        jobRole: row.jobRole,
        schedule: resumirHorario(schedules),
        isActive: row.isActive,
        schedules,
        services,
        rating: row.rating ?? 0,
      };
    });
  }

  async findSnapshotByBranch(branchId: string) {
    const rows = await this.db.execute<{
      id: string;
      name: string;
      email: string | null;
      avatarUrl: string | null;
      status: 'pending' | 'active' | 'disabled';
      jobRole: string | null;
      isActive: boolean;
      rating: number | null;
      schedules: unknown;
      services: unknown;
    }>(sql`
      SELECT
        s.id AS "id",
        s.name AS "name",
        s.email AS "email",
        s.avatar_url AS "avatarUrl",
        s.status AS "status",
        s."jobRole" AS "jobRole",
        s.is_active AS "isActive",
        COALESCE(r.avg_rating, 0)::float AS "rating",
        COALESCE(sch.items, '[]'::json) AS "schedules",
        COALESCE(srv.items, '[]'::json) AS "services"
      FROM staff s
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', ss.id,
            'dayOfWeek', ss.day_of_week,
            'startTime', ss.start_time,
            'endTime', ss.end_time
          )
          ORDER BY ss.day_of_week, ss.start_time
        ) AS items
        FROM staff_schedules ss
        WHERE ss.staff_id = s.id
      ) sch ON TRUE
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', sv.id,
            'name', sv.name,
            'durationMin', sv.duration_min,
            'priceCents', sv.price_cents,
            'category', sc.name,
            'categoryColor', sc.color_hex,
            'categoryIcon', sc.icon
          )
          ORDER BY sv.name
        ) AS items
        FROM staff_services ssv
        JOIN services sv
          ON sv.id = ssv.service_id
        LEFT JOIN service_categories sc
          ON sc.id = sv.category_id
        WHERE ssv.staff_id = s.id
      ) srv ON TRUE
      LEFT JOIN LATERAL (
        SELECT AVG(pbr.rating)::float AS avg_rating
        FROM public_booking_rating_staff prs
        JOIN public_booking_ratings pbr
          ON pbr.id = prs.rating_id
        WHERE prs.staff_id = s.id
      ) r ON TRUE
      WHERE s.branch_id = ${branchId}
        AND s.is_active = TRUE
      ORDER BY s.name ASC
    `);

    return rows.map((row) => {
      const schedules = parseJsonArray<{
        id: number;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
      }>(row.schedules);
      const services = parseJsonArray<{
        id: string;
        name: string;
        durationMin: number;
        priceCents?: number | null;
        category?: string | null;
        categoryColor?: string | null;
        categoryIcon?: string | null;
      }>(row.services);

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        avatarUrl: row.avatarUrl,
        status: row.status,
        jobRole: row.jobRole,
        schedule: resumirHorario(schedules),
        isActive: row.isActive,
        schedules,
        services,
        rating: row.rating ?? 0,
      };
    });
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
        .set({
          expiresAt: new Date(),
          status: 'expired',
        })
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

      const baseUrl = process.env.PUBLIC_APP_URL;
      const inviteLink = `${baseUrl}/accept-invite?token=${token}`;

      const organization = await tx.query.organizations.findFirst({
        where: eq(organizations.id, branchRow.organizationId),
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      await mailQueue.add('invite-staff', {
        to: email,
        inviteLink,

        organization: organization.name, // luego puedes mapear a nombre
        branch: branchRow.name,

        staffName: staffRow.name,
        avatarUrl: staffRow.avatarUrl,

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

      // ❌ ya NO usamos userId como truth absoluto
      // (esto lo valida el use case con invites)

      const branchRow = await tx.query.branches.findFirst({
        where: eq(branches.id, staffRow.branchId),
      });

      if (!branchRow) {
        throw new NotFoundException('Branch not found');
      }

      // 🔥 1. EXPIRAR TODAS LAS INVITES ANTERIORES
      await tx
        .update(staffInvites)
        .set({
          expiresAt: new Date(),
          status: 'expired',
        })
        .where(eq(staffInvites.staffId, staffId));

      // 🔥 2. TOMAR ROLE DE LA ÚLTIMA INVITE
      const lastInvite = await tx.query.staffInvites.findFirst({
        where: eq(staffInvites.staffId, staffId),
        orderBy: desc(staffInvites.createdAt),
      });

      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const [invite] = await tx
        .insert(staffInvites)
        .values({
          email: staffRow.email,
          staffId,
          role: lastInvite?.role ?? 'staff',
          token,
          expiresAt,
          status: 'pending',
        })
        .returning();

      // 🔥 3. MISMO BASE URL QUE inviteStaff
      const baseUrl = process.env.PUBLIC_APP_URL;
      const inviteLink = `${baseUrl}/accept-invite?token=${token}`;

      const organization = await tx.query.organizations.findFirst({
        where: eq(organizations.id, branchRow.organizationId),
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      // 🔥 4. MISMO PAYLOAD QUE inviteStaff
      await mailQueue.add('invite-staff', {
        to: staffRow.email,
        inviteLink,

        organization: organization.name, // igual que invite
        branch: branchRow.name,

        staffName: staffRow.name,
        avatarUrl: staffRow.avatarUrl,

        role: invite.role,
      });

      return { ok: true };
    });
  }
  async findByBranchWithInvites(branchId: string) {
    const result = await this.db.execute<{
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      avatarUrl: string | null;
      status: 'pending' | 'active' | 'disabled';
      jobRole: string | null;
      isActive: boolean;

      inviteStatus: 'pending' | 'accepted' | 'expired' | null;
      inviteExpiresAt: Date | null;
      inviteCreatedAt: Date | null;
    }>(sql`
    SELECT DISTINCT ON (s.id)
      s.id,
      s.name,
      s.email,
      s.phone,
      s.avatar_url as "avatarUrl",
      s.status,
      s."jobRole",
      s.is_active as "isActive",

      si.status as "inviteStatus",
      si.expires_at as "inviteExpiresAt",
      si.created_at as "inviteCreatedAt"

    FROM staff s

    LEFT JOIN staff_invites si
      ON si.staff_id = s.id

    WHERE s.branch_id = ${branchId}

    ORDER BY s.id, si.created_at DESC
  `);

    const rows = Array.from(result);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      avatarUrl: r.avatarUrl,
      status: r.status,
      jobRole: r.jobRole,
      isActive: r.isActive,

      invite: r.inviteStatus
        ? {
            status: r.inviteStatus,
            expiresAt: r.inviteExpiresAt ? toIso(r.inviteExpiresAt) : null,
            createdAt: r.inviteCreatedAt ? toIso(r.inviteCreatedAt) : null,
          }
        : null,
    }));
  }

  async findLatestInviteByStaffId(
    staffId: string,
  ): Promise<StaffInviteInfo | null> {
    const invite = await this.db.query.staffInvites.findFirst({
      where: eq(staffInvites.staffId, staffId),
      orderBy: desc(staffInvites.createdAt),
    });

    if (!invite) return null;

    return {
      id: invite.id,
      staffId: invite.staffId,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt ?? new Date(),
    };
  }

  async findInactiveByBranch(branchId: string) {
    return this.db.query.staff.findMany({
      where: and(eq(staff.branchId, branchId), eq(staff.isActive, false)),
    });
  }

  async activate(staffId: string) {
    const [updated] = await this.db
      .update(staff)
      .set({
        isActive: true,
        status: 'active', // si usas status también
      })
      .where(eq(staff.id, staffId))
      .returning();

    return updated;
  }
}
