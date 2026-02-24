"use client";

import { useEffect, useState } from "react";
import { getNotificationDetail } from "@/lib/services/notifications";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarSync,
  CalendarX,
  Clock,
  MessageCircle,
  Pencil,
  Send,
  Star,
} from "lucide-react";
import { resolveActions, ActionType } from "@/lib/helpers/notifications";
import { Button } from "@/components/ui/button";

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const notificationId = params?.notificationId as string;

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!notificationId) return;
    getNotificationDetail(notificationId).then(setData);
  }, [notificationId]);

  if (!data) {
    return (
      <div className="h-full overflow-y-auto p-6 text-muted-foreground">
        Cargando...
      </div>
    );
  }

  const { notification, booking, branch } = data;

  const date = new Date(booking.startsAt);
  const end = new Date(booking.endsAt);
  const total = booking.totalCents / 100;
  const client = booking.appointments?.[0]?.client;

  const actions = resolveActions(notification, booking);

  console.log(notification);

  const isCancelledNotification = notification.kind === "BOOKING_CANCELLED";

  const isRescheduledNotification = notification.kind === "BOOKING_RESCHEDULED";

  const isChatNotification = notification.kind === "CHAT_MESSAGE";

  return (
    <div className="h-full bg-background flex flex-col">
      {/* ================= SCROLLABLE CONTENT ================= */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 md:px-6 lg:px-8 py-8 space-y-8">
          {/* HEADER */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold leading-tight">{branch.name}</h1>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="capitalize">
                {date.toLocaleDateString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
              <span>·</span>
              <span>
                {date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                –{" "}
                {end.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {isChatNotification && (
            <div className="flex flex-col items-center justify-center py-10 px-4 space-y-10">
              {/* 🔔 Header minimal */}
              <div className="text-center space-y-3 max-w-sm">
                <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <MessageCircle className="h-7 w-7 text-muted-foreground" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight">
                  Nuevo mensaje
                </h2>

                <p className="text-muted-foreground text-sm">
                  Tienes un mensaje pendiente en tu bandeja.
                </p>
              </div>

              {/* 💬 Floating Notification Card */}
              <div className="w-full max-w-md">
                <div className="relative rounded-3xl bg-white shadow-xl border px-5 py-4 flex items-center gap-4 transition hover:scale-[1.01] duration-200">
                  {/* Avatar */}
                  {notification.payload?.sender?.avatarUrl ? (
                    <img
                      src={notification.payload.sender.avatarUrl}
                      alt={notification.payload.sender.name}
                      className="h-12 w-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold truncate">
                        {notification.payload?.sender?.name ?? "Nuevo mensaje"}
                      </p>

                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(notification.createdAt).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {notification.payload?.preview}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notification.readAt && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full ring-4 ring-white" />
                  )}
                </div>
              </div>

              {/* 🔘 CTA principal estilo pill */}
              <div className="w-full max-w-md space-y-4">
                <Button
                  size="lg"
                  className="w-full h-14 rounded-full text-base font-semibold shadow-md"
                  onClick={() =>
                    router.push(
                      `/dashboard/inbox/messages/${notification.payload?.conversationId}`,
                    )
                  }
                >
                  Ir al chat
                </Button>
              </div>
            </div>
          )}

          {/* 🔥 CANCELLED BANNER */}
          {isCancelledNotification && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Esta reserva fue cancelada por{" "}
              <span className="font-semibold">
                {notification.payload?.meta?.cancelledBy === "PUBLIC"
                  ? "el cliente"
                  : "el local"}
              </span>
            </div>
          )}

          {/* 🔄 RESCHEDULED BANNER */}
          {isRescheduledNotification && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              Esta reserva fue reagendada.
            </div>
          )}

          {/* CLIENTE */}
          {!isChatNotification && client && (
            <div className="border rounded-2xl p-6 flex items-center gap-4 bg-white">
              <div className="h-14 w-14 rounded-full overflow-hidden border shrink-0">
                <img
                  src={client.avatarUrl ?? ""}
                  alt={client.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase text-muted-foreground tracking-wide">
                  Cliente
                </p>
                <p className="text-lg font-semibold truncate">{client.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {client.email}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {client.phone}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                className="h-10 rounded-full px-5 font-semibold"
              >
                Ver perfil
              </Button>
            </div>
          )}

          {/* ================= DETALLE RESERVA ================= */}
          <div className="rounded-2xl border bg-background overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-sm uppercase tracking-wide text-muted-foreground">
                Detalle de la reserva
              </h2>
            </div>

            <div className="divide-y">
              {booking.appointments.map((appt: any) => {
                const status = appt.status;

                const isCancelled = status === "CANCELLED";
                const isCompleted = status === "COMPLETED";

                return (
                  <div
                    key={appt.appointmentId}
                    className={`px-5 py-4 space-y-3 ${
                      isCancelled ? "opacity-60" : ""
                    }`}
                  >
                    {/* Nombre + Precio */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 min-w-0">
                        <p
                          className={`font-semibold text-base truncate ${
                            isCancelled ? "line-through" : ""
                          }`}
                        >
                          {appt.service.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {appt.category?.name} · {appt.service.durationMin} min
                        </p>
                      </div>

                      <p
                        className={`font-semibold text-base shrink-0 ${
                          isCancelled ? "line-through" : ""
                        }`}
                      >
                        ${(appt.priceCents / 100).toLocaleString()}
                      </p>
                    </div>

                    {/* STATUS BADGE */}
                    <div className="flex items-center gap-2 text-xs">
                      {isCancelled && (
                        <span className="px-2 py-1 rounded-full bg-red-100 text-red-600 font-medium">
                          Cancelado
                        </span>
                      )}

                      {isCompleted && (
                        <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-600 font-medium">
                          Completado
                        </span>
                      )}

                      {isRescheduledNotification && !isCancelled && (
                        <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-600 font-medium">
                          Reagendado
                        </span>
                      )}
                    </div>

                    {/* Staff */}
                    {appt.staff && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {appt.staff.avatarUrl && (
                          <img
                            src={appt.staff.avatarUrl}
                            alt={appt.staff.name}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        )}
                        <span>
                          Atendido por{" "}
                          <span className="font-medium text-foreground">
                            {appt.staff.name}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* TOTAL */}
            <div className="border-t px-5 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Total
                  </p>
                  <p className="text-3xl font-bold tracking-tight mt-1">
                    ${total.toLocaleString()}
                    <span className="text-sm font-medium text-muted-foreground ml-1">
                      MXN
                    </span>
                  </p>
                </div>

                <div className="text-right text-xs text-muted-foreground space-y-1">
                  <p>
                    {booking.appointments.length} servicio
                    {booking.appointments.length > 1 ? "s" : ""}
                  </p>

                  <span className="px-2 py-1 rounded-full bg-background border font-medium">
                    {booking.paymentMethod}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= FOOTER TOOLBAR ================= */}
      <div className="border-t bg-background">
        <div className="px-4 py-4">
          <div className="flex w-full gap-2">
            {actions
              .filter((a) => a !== "VIEW_BOOKING")
              .map((action) => (
                <Button
                  key={action}
                  onClick={() => handleAction(action, booking.id, router)}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-11"
                  tooltip={labelMap[action]}
                >
                  {getIcon(action)}
                </Button>
              ))}

            {actions.includes("VIEW_BOOKING") && (
              <Button
                onClick={() => handleAction("VIEW_BOOKING", booking.id, router)}
                variant="default"
                size="sm"
                className="flex-[3] h-11"
              >
                {labelMap["VIEW_BOOKING"]}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= ACTION HANDLER ================= */

function handleAction(type: ActionType, bookingId: string, router: any) {
  switch (type) {
    case "EDIT_BOOKING":
      router.push(`/dashboard/bookings/${bookingId}/edit`);
      break;
    case "RESCHEDULE_BOOKING":
      router.push(`/dashboard/bookings/${bookingId}/reschedule`);
      break;
    case "CANCEL_BOOKING":
      router.push(`/dashboard/bookings/${bookingId}/cancel`);
      break;
    case "MESSAGE_CLIENT":
      router.push(`/dashboard/chat?booking=${bookingId}`);
      break;
    case "VIEW_REVIEW":
      router.push(`/dashboard/reviews`);
      break;
    case "GO_TO_CHAT":
      router.push(`/dashboard/chat`);
      break;
    case "VIEW_BOOKING":
      router.push(`/dashboard/bookings/${bookingId}`);
      break;
  }
}

/* ================= LABEL MAP ================= */

const labelMap: Record<ActionType, string> = {
  VIEW_BOOKING: "Ver cita",
  EDIT_BOOKING: "Editar",
  RESCHEDULE_BOOKING: "Reagendar",
  CANCEL_BOOKING: "Cancelar",
  MESSAGE_CLIENT: "Mensaje",
  VIEW_REVIEW: "Ver reseña",
  GO_TO_CHAT: "Ir al chat",
};

function getIcon(type: ActionType) {
  switch (type) {
    case "EDIT_BOOKING":
      return <Pencil className="h-4 w-4" />;
    case "RESCHEDULE_BOOKING":
      return <CalendarSync className="h-4 w-4" />;
    case "CANCEL_BOOKING":
      return <CalendarX className="h-4 w-4" />;
    case "MESSAGE_CLIENT":
      return <Send className="h-4 w-4" />;
    case "VIEW_REVIEW":
      return <Star className="h-4 w-4" />;
    case "GO_TO_CHAT":
      return <MessageCircle className="h-4 w-4" />;
    default:
      return null;
  }
}
