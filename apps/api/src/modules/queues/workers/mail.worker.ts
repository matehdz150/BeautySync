/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import nodemailer from 'nodemailer';
import { Worker as BullWorker } from 'bullmq';
import 'dotenv/config';

import { redis } from '../redis/redis.provider';

import type { BookingMailPayload } from '../mail/types/mail.types';
import type { BookingMailName } from '../mail/types/mail.types';

import { buildBookingMail } from '../mail/booking/booking-mail.router';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

function isBookingMail(name: string): name is BookingMailName {
  return (
    name === 'mail.booking.confirmation' ||
    name === 'mail.booking.reminder24h' ||
    name === 'mail.booking.reminder2h' ||
    name === 'mail.booking.reminder30m' ||
    name === 'mail.booking.reminder30m' ||
    name === 'mail.booking.cancelled'
  );
}

export const mailWorker = new BullWorker(
  'mail-queue',
  async (job) => {
    console.log('📩 Procesando correo:', job.name, job.data);

    // =============================
    // STAFF INVITE
    // =============================
    if (job.name === 'invite-staff') {
      const { to, inviteLink, invitedBy, organization, branch } = job.data;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await transporter.sendMail({
        from: '"BeautySync" <no-reply@beautysync.com>',
        to,
        subject: `${invitedBy} te invitó a unirte a ${organization}`,
        html: `
          <h2>Te invitaron a ${organization}</h2>
          <p><strong>${invitedBy}</strong> te invitó ${
            branch ? `a la sucursal <strong>${branch}</strong>` : ''
          }.</p>
          <p>Da clic aquí para aceptar:</p>
          <a href="${inviteLink}">${inviteLink}</a>
          <p>Este enlace expira en 24 horas.</p>
        `,
      });

      console.log('📨 Email sent →', to);
      return;
    }

    // =============================
    // BOOKING MAILS (REACT EMAIL)
    // =============================
    if (isBookingMail(job.name)) {
      const data = job.data as BookingMailPayload;

      const { subject, html } = await buildBookingMail(job.name, data);

      console.log('HTML type:', typeof html);
      console.log('HTML preview:', html?.slice?.(0, 80));

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await transporter.sendMail({
        from: '"BeautySync" <no-reply@beautysync.com>',
        to: data.to,
        subject,
        html,
      });

      console.log('📨 Booking email sent →', job.name, data.to, data.bookingId);
      return;
    }

    console.log('⚠️ Job no manejado:', job.name);
  },
  { connection: redis },
);

mailWorker.on('completed', (job) => console.log(`✅ Job ${job.id} completado`));
mailWorker.on('failed', (job, err) =>
  console.error(`❌ Job ${job?.id} falló`, err),
);
