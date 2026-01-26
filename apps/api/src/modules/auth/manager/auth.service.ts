import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { eq, InferSelectModel } from 'drizzle-orm';
import * as client from 'src/modules/db/client';
import { branches, staff, users } from 'src/modules/db/schema';
import { JwtService } from '@nestjs/jwt';
import { AdminCreateUserDto } from '../dto/admin-create-user';
import { PublicRegisterDto } from '../dto/public-register.dto';
import { staffInvites } from 'src/modules/db/schema/staff/staffInvites';
import { AcceptInviteDto } from '../dto/accept-invite.dto';

type StaffInviteWithStaff = InferSelectModel<typeof staffInvites> & {
  staff: {
    id: string;
    name: string;
    branchId: string;
  };
};

@Injectable()
export class AuthService {
  constructor(
    @Inject('DB') private db: client.DB,
    private jwt: JwtService,
  ) {}

  async registerAdmin(dto: AdminCreateUserDto) {
    const existing = await this.db.query.users.findFirst({
      where: eq(users.email, dto.email),
    });

    if (existing) throw new BadRequestException('Email already exists');

    if (!['owner', 'manager', 'staff'].includes(dto.role)) {
      throw new BadRequestException('Invalid role');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const [user] = await this.db
      .insert(users)
      .values({
        email: dto.email,
        passwordHash,
        role: dto.role,
        organizationId: dto.organizationId ?? null,
      })
      .returning();

    return user;
  }

  async registerPublic(dto: PublicRegisterDto) {
    const existing = await this.db.query.users.findFirst({
      where: eq(users.email, dto.email),
    });

    if (existing) throw new BadRequestException('Email already exists');

    if (!['manager', 'staff'].includes(dto.role)) {
      throw new BadRequestException('Invalid role for public registration');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const [user] = await this.db
      .insert(users)
      .values({
        email: dto.email,
        passwordHash,
        role: dto.role,
        organizationId: null,
      })
      .returning();

    return this.signTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 🔐 comparar password
    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 🎟 emitir tokens
    const tokens = this.signTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.organizationId,
        needsOnboarding: user.role === 'owner' && !user.organizationId,
      },
    };
  }

  signTokens(user: typeof users.$inferSelect) {
    const payload = {
      sub: user.id,

      orgId: user.organizationId,

      role: user.role,
    };

    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: '1h',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET!,
      expiresIn: '7d',
    });

    console.log('SIGNING WITH SECRET=', process.env.JWT_ACCESS_SECRET);

    return { accessToken, refreshToken };
  }

  async validateInvite(token: string) {
    const invite = (await this.db.query.staffInvites.findFirst({
      where: eq(staffInvites.token, token),
      with: { staff: true },
    })) as StaffInviteWithStaff | undefined;

    if (!invite) throw new NotFoundException('Invite not found');

    if (invite.expiresAt < new Date())
      throw new BadRequestException('Invite expired');

    if (invite.accepted)
      throw new BadRequestException('Invite already accepted');

    if (!invite.staff) throw new NotFoundException('Staff not found');

    return {
      email: invite.email,
      staffName: invite.staff.name,
      role: invite.role, // 👈 IMPORTANTE — ya lo tienes guardado en la invite
    };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    if (!dto.token) {
      throw new BadRequestException('Invite token is required');
    }

    return this.db.transaction(async (tx) => {
      const invite = await tx.query.staffInvites.findFirst({
        where: eq(staffInvites.token, dto.token),
      });

      if (!invite) throw new NotFoundException('Invite not found');
      if (invite.expiresAt < new Date())
        throw new BadRequestException('Invite expired');
      if (invite.accepted) throw new BadRequestException('Invite already used');

      // 1️⃣ obtener staff ligado a la invitación
      const staffRow = await tx.query.staff.findFirst({
        where: eq(staff.id, invite.staffId),
      });

      if (!staffRow) throw new NotFoundException('Staff not found');

      // 2️⃣ validar que los correos coinciden (seguridad extra)
      if (staffRow.email !== invite.email) {
        throw new BadRequestException('Invite email mismatch');
      }

      // 3️⃣ obtener branch para extraer la organización
      const branchRow = await tx.query.branches.findFirst({
        where: eq(branches.id, staffRow.branchId),
      });

      if (!branchRow) throw new NotFoundException('Branch not found');

      // 4️⃣ prevenir doble cuenta con el mismo correo
      const existingUser = await tx.query.users.findFirst({
        where: eq(users.email, invite.email),
      });

      if (existingUser)
        throw new BadRequestException('Email already registered');

      // 5️⃣ crear usuario
      const [user] = await tx
        .insert(users)
        .values({
          email: invite.email,
          passwordHash: await bcrypt.hash(dto.password, 10),
          role: invite.role, // <- viene de tabla — validado antes
          organizationId: branchRow.organizationId,
        })
        .returning();

      // 6️⃣ ligar usuario al staff + activar
      await tx
        .update(staff)
        .set({
          userId: user.id,
          status: 'active',
        })
        .where(eq(staff.id, staffRow.id));

      // 7️⃣ marcar invitación como usada
      await tx
        .update(staffInvites)
        .set({ accepted: true })
        .where(eq(staffInvites.id, invite.id));

      return { ok: true };
    });
  }
}
