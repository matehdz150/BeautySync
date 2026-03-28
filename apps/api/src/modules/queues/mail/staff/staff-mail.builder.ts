import * as React from 'react';
import { renderEmail } from '../mail.renderer';
import { StaffInviteEmail } from '../templates/StaffInviteEmail';

export type StaffInviteMailPayload = {
  to: string;
  inviteLink: string;
  invitedBy: string;
  organization: string;
  branch?: string;
  staffName: string;
  avatarUrl?: string | null;
};

export async function buildStaffInviteMail(data: StaffInviteMailPayload) {
  const subject = `Te invitaron a unirte a ${data.organization}`;

  const html = await renderEmail(
    React.createElement(StaffInviteEmail, {
      staffName: data.staffName,
      invitedBy: data.invitedBy,
      organization: data.organization,
      branch: data.branch,
      inviteLink: data.inviteLink,
      avatarUrl: data.avatarUrl,
    }),
  );

  return { subject, html };
}
