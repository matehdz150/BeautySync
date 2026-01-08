import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as client from '../db/client';
import { organizations, branches, branchSettings, users } from '../db/schema';
import { OnboardOwnerDto } from './dto/onboard-owner.dto';
import { eq } from 'drizzle-orm';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OnboardingService {
  constructor(
    @Inject('DB') private db: client.DB,
    private readonly jwtService: JwtService,
  ) {}

  async onboardOwner(userId: string, dto: OnboardOwnerDto) {
    return this.db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) throw new BadRequestException('User not found');

      if (user.role !== 'owner')
        throw new BadRequestException('Only owners may onboard');

      if (user.organizationId)
        throw new BadRequestException('User already has organization');

      // 1️⃣ Crear organización
      const [org] = await tx
        .insert(organizations)
        .values({ name: dto.organizationName })
        .returning();

      // 2️⃣ Crear branches
      let firstBranchId: string | null = null;

      for (const b of dto.branches) {
        const [branch] = await tx
          .insert(branches)
          .values({
            organizationId: org.id,
            name: b.name,
            address: b.address ?? null,
          })
          .returning();

        if (!firstBranchId) firstBranchId = branch.id;

        await tx.insert(branchSettings).values({
          branchId: branch.id,
          timezone: b.settings?.timezone ?? 'America/Mexico_City',
          minBookingNoticeMin: b.settings?.minBookingNoticeMin ?? 0,
          maxBookingAheadDays: b.settings?.maxBookingAheadDays ?? 60,
          cancelationWindowMin: b.settings?.cancelationWindowMin ?? 120,
          bufferBeforeMin: b.settings?.bufferBeforeMin ?? 0,
          bufferAfterMin: b.settings?.bufferAfterMin ?? 0,
        });
      }

      // 3️⃣ Vincular owner → org
      await tx
        .update(users)
        .set({ organizationId: org.id })
        .where(eq(users.id, user.id));

      // 4️⃣ 🔥 GENERAR JWT NUEVO CON orgId
      const token = this.jwtService.sign({
        sub: user.id,
        orgId: org.id,
        role: user.role,
      });

      return {
        organizationId: org.id,
        branchId: firstBranchId,
        token, // 👈 AQUÍ ESTÁ LA MAGIA
      };
    });
  }
}
