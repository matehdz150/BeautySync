import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import type { DB } from 'src/modules/db/client';
import { staffInvites } from 'src/modules/db/schema/staff/staffInvites';

import {
  InvitesRepositoryPort,
  StaffInvite,
} from '../../core/ports/invites.repository';

@Injectable()
export class StaffInvitesDrizzleRepository implements InvitesRepositoryPort {
  constructor(@Inject('DB') private readonly db: DB) {}

  async findByToken(token: string): Promise<StaffInvite | null> {
    const invite = await this.db.query.staffInvites.findFirst({
      where: eq(staffInvites.token, token),
    });

    if (!invite) return null;

    return {
      id: invite.id,
      token: invite.token,
      email: invite.email,
      role: invite.role,
      staffId: invite.staffId,
      expiresAt: invite.expiresAt,
      accepted: invite.accepted ?? false,
      status: invite.status,
    };
  }

  async markAccepted(inviteId: string): Promise<void> {
    await this.db
      .update(staffInvites)
      .set({
        accepted: true,
        status: 'accepted',
      })
      .where(eq(staffInvites.id, inviteId));
  }
}
