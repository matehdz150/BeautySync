import * as React from 'react';
import { renderEmail } from '../mail.renderer';
import { GiftCardEmail } from '../templates/ GiftCardEmail';

export type GiftCardPayload = {
  to: string;
  code: string;
  amountCents: string;
  organization: string;
  branch?: string;
  claimLink: string;
  coverUrl: string;
};

export async function buildGiftCardMail(data: GiftCardPayload) {
  const subject = `Has recibido una tarjeta de regalo de ${data.branch}`;

  const html = await renderEmail(
    React.createElement(GiftCardEmail, {
      amountCents: data.amountCents,
      code: data.code,
      branch: data.branch,
      organization: data.organization,
      claimLink: data.claimLink,
      coverUrl: data.coverUrl,
    }),
  );

  return { subject, html };
}
