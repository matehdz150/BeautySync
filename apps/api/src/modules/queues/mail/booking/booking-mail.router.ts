import * as React from 'react';
import type { BookingMailName, BookingMailPayload } from '../types/mail.types';
import { renderEmail } from '../mail.renderer';

// ✅ por ahora solo tenemos este template
import { PublicBookingConfirmedEmail } from '../templates/PublicBookingConfirmedEmail';
import { PublicBookingReminder24hEmail } from '../templates/PublicBookingReminder24hEmail';
import { PublicBookingReminder2hEmail } from '../templates/PublicBookingReminder2hEmail';
import { PublicBookingFollowup5mEmail } from '../templates/PublicBookingFollowup5mEmail';
import { PublicBookingReminder30mEmail } from '../templates/PublicBookingReminder30mEmail';
import { PublicBookingCancelledEmail } from '../templates/PublicBookingCancelledEmail';

type MailBuildResult = {
  subject: string;
  html: string;
};

export async function buildBookingMail(
  name: BookingMailName,
  data: BookingMailPayload,
): Promise<MailBuildResult> {
  // validación mínima
  if (!data.to || typeof data.to !== 'string' || data.to.trim().length === 0) {
    throw new Error("Missing 'to' in booking mail payload");
  }

  // 🔥 Aquí es donde luego agregas tus 3 templates nuevos
  switch (name) {
    case 'mail.booking.confirmation': {
      const subject = 'Tu cita fue confirmada ✨';

      const html = await renderEmail(
        React.createElement(PublicBookingConfirmedEmail, {
          title: 'Tu cita está confirmada',
          customerName: data.userName ?? 'Cliente',
          branchName: data.branchName ?? 'Sucursal',
          branchAddress: data.branchAddress ?? null,
          coverUrl: data.branchImageUrl ?? null,

          dateText: data.dateLabel ?? '',
          timeText: data.timeLabel ?? '',

          statusText: 'Confirmada',
          totalText: data.totalLabel ?? '',
          bookingRef: data.bookingId,

          manageUrl: data.manageUrl,
          directionsUrl: data.directionsUrl ?? undefined,
          establishmentUrl: data.establishmentUrl ?? undefined,
        }),
      );

      return { subject, html };
    }

    // ⚠️ placeholders listos (todavía sin templates)
    case 'mail.booking.reminder24h': {
      const subject = 'Recordatorio: tu cita es mañana';

      const html = await renderEmail(
        React.createElement(PublicBookingReminder24hEmail, {
          customerName: data.userName ?? 'Cliente',
          branchName: data.branchName ?? 'Sucursal',
          branchAddress: data.branchAddress ?? null,
          coverUrl: data.branchImageUrl ?? null,

          dateText: data.dateLabel ?? '',
          timeText: data.timeLabel ?? '',

          bookingRef: data.bookingId,
          manageUrl: data.manageUrl,

          directionsUrl: data.directionsUrl ?? undefined,
          establishmentUrl: data.establishmentUrl ?? undefined,
        }),
      );

      return { subject, html };
    }

    case 'mail.booking.reminder2h': {
      const subject = 'Recordatorio: tu cita es en 2 horas';

      const html = await renderEmail(
        React.createElement(PublicBookingReminder2hEmail, {
          customerName: data.userName ?? 'Cliente',
          branchName: data.branchName ?? 'Sucursal',
          branchAddress: data.branchAddress ?? null,
          coverUrl: data.branchImageUrl ?? null,

          dateText: data.dateLabel ?? '',
          timeText: data.timeLabel ?? '',

          bookingRef: data.bookingId,
          manageUrl: data.manageUrl,

          directionsUrl: data.directionsUrl ?? undefined,
          establishmentUrl: data.establishmentUrl ?? undefined,
        }),
      );

      return { subject, html };
    }

    case 'mail.booking.followup5m': {
      const subject = '¿Qué tal estuvo tu cita? ✨';

      // 👇 estos links los vas a definir según tu app
      // recomendado: que vayan a tu frontend con el bookingId
      const rateUrl = `${process.env.PUBLIC_APP_URL}${data.manageUrl}?rate=1`;
      const reviewUrl = `${process.env.PUBLIC_APP_URL}${data.manageUrl}?review=1`;

      const html = await renderEmail(
        React.createElement(PublicBookingFollowup5mEmail, {
          customerName: data.userName ?? 'Cliente',
          branchName: data.branchName ?? 'Sucursal',
          branchAddress: data.branchAddress ?? null,
          coverUrl: data.branchImageUrl ?? null,

          dateText: data.dateLabel ?? '',
          timeText: data.timeLabel ?? '',

          bookingRef: data.bookingId,

          manageUrl: `${process.env.PUBLIC_APP_URL}${data.manageUrl}`,
          rateUrl,
          reviewUrl,

          establishmentUrl: data.establishmentUrl ?? undefined,
        }),
      );

      return { subject, html };
    }

    case 'mail.booking.reminder30m': {
      const subject = 'Recordatorio: tu cita es en 30 minutos';
      const html = await renderEmail(
        React.createElement(PublicBookingReminder30mEmail, {
          customerName: data.userName ?? 'Cliente',
          branchName: data.branchName ?? 'Sucursal',
          branchAddress: data.branchAddress ?? null,
          coverUrl: data.branchImageUrl ?? null,
          dateText: data.dateLabel ?? '',
          timeText: data.timeLabel ?? '',
          bookingRef: data.bookingId,
          manageUrl: data.manageUrl,
          directionsUrl: data.directionsUrl ?? undefined,
          establishmentUrl: data.establishmentUrl ?? undefined,
          serviceLine: data.serviceLine ?? undefined,
          staffLine: data.staffLine ?? undefined,
        }),
      );

      return { subject, html };
    }

    case 'mail.booking.cancelled': {
      const subject = 'Tu cita fue cancelada';

      // URLs: usa PUBLIC_APP_URL si la tienes; si no, fallback al manageUrl ya construido
      const appUrl =
        process.env.PUBLIC_APP_URL ?? process.env.PUBLIC_WEB_URL ?? '';
      const manageUrl = data.manageUrl.startsWith('http')
        ? data.manageUrl
        : `${appUrl}${data.manageUrl}`;

      // rebookUrl: puedes apuntar a la sucursal (si la tienes) o a "nueva reserva"
      const rebookUrl = data.rebookUrl?.startsWith('http')
        ? data.rebookUrl
        : data.rebookUrl
          ? `${appUrl}${data.rebookUrl}`
          : `${appUrl}`; // fallback (mejor que quede tu home)

      const html = await renderEmail(
        React.createElement(PublicBookingCancelledEmail, {
          customerName: data.userName ?? 'Cliente',
          branchName: data.branchName ?? 'Sucursal',
          branchAddress: data.branchAddress ?? null,
          coverUrl: data.branchImageUrl ?? null,

          dateText: data.dateLabel ?? '',
          timeText: data.timeLabel ?? '',

          bookingRef: data.bookingId,

          cancelledBy: data.cancelledBy ?? 'PUBLIC',
          reason: data.cancelReason ?? null,

          manageUrl,
          rebookUrl,

          establishmentUrl: data.establishmentUrl ?? undefined,
        }),
      );

      return { subject, html };
    }

    default: {
      // TS exhaustivo
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}
