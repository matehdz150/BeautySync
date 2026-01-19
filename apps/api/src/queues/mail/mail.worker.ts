/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import nodemailer from 'nodemailer';
import { redis } from '../redis/redis.provider';
import { Worker as BullWorker } from 'bullmq';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

export const mailWorker = new BullWorker(
  'mail-queue',
  async (job) => {
    console.log('📩 Procesando correo:', job.name, job.data);

    if (job.name === 'invite-staff') {
      const { to, inviteLink, invitedBy, organization, branch } = job.data;

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
    }
  },
  { connection: redis },
);

mailWorker.on('completed', (job) => console.log(`✅ Job ${job.id} completado`));

mailWorker.on('failed', (job, err) =>
  console.error(`❌ Job ${job?.id} falló`, err),
);
