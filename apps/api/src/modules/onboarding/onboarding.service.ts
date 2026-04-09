import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as client from '../db/client';
import { organizations, branches, branchSettings, users } from '../db/schema';
import { OnboardOwnerDto } from './dto/onboard-owner.dto';
import { eq } from 'drizzle-orm';
import { JwtService } from '@nestjs/jwt';
import { trackAction } from '../metrics/action-metrics';

@Injectable()
export class OnboardingService {
  constructor(
    @Inject('DB') private db: client.DB,
    private readonly jwtService: JwtService,
  ) {}

  async onboardOwner(userId: string, dto: OnboardOwnerDto) {
    return trackAction('REGISTER_USER', () =>
      this.db.transaction(async (tx) => {
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
          const latProvided = typeof b.lat === 'number';
          const lngProvided = typeof b.lng === 'number';

          if (latProvided !== lngProvided) {
            throw new BadRequestException('lat y lng deben venir juntos');
          }

          const hasCoords = latProvided && lngProvided;

          if (hasCoords) {
            if (b.lat! < -90 || b.lat! > 90) {
              throw new BadRequestException('lat inválida');
            }
            if (b.lng! < -180 || b.lng! > 180) {
              throw new BadRequestException('lng inválida');
            }
          }

          const [branch] = await tx
            .insert(branches)
            .values({
              organizationId: org.id,
              name: b.name,
              address: b.address ?? null,

              lat: hasCoords ? b.lat!.toString() : null,
              lng: hasCoords ? b.lng!.toString() : null,

              isLocationVerified: hasCoords,
              locationUpdatedAt: hasCoords ? new Date() : null,
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
      }),
    );
  }
}
