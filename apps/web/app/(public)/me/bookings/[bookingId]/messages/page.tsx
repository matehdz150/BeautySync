"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

import { getMyPublicBookingById } from "@/lib/services/public/me/appointments";

import { useConversationByBooking } from "@/hooks/chat/useConversationsByBooking";
import { useChatMessages } from "@/hooks/chat/useChatMessages";
import { useChatStream } from "@/hooks/chat/useChatStream";
import { useSendMessage } from "@/hooks/chat/useSendMessage";
import { useChat } from "@/hooks/chat/useChat";

import type {
  PublicBookingDetailResponse,
  PublicBookingAppointmentItem,} from "@/lib/services/public/me/appointments";

export default function BookingMessagePage() {
  const params = useParams();
  const raw = params.bookingId;
  const bookingId = Array.isArray(raw) ? raw[0] : raw;

  const [message, setMessage] = useState("");
  const [localConversationId, setLocalConversationId] =
    useState<string | null>(null);

  const [booking, setBooking] =
    useState<PublicBookingDetailResponse["booking"] | null>(null);

  const [bookingLoading, setBookingLoading] = useState(true);

  // ================================
  // LOAD BOOKING DETAIL
  // ================================
  useEffect(() => {
    if (!bookingId) return;

    let cancelled = false;

    async function load() {
      try {
        const data = await getMyPublicBookingById(bookingId);
        if (!cancelled) {
          setBooking(data.booking);
        }
      } finally {
        if (!cancelled) setBookingLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // ================================
  // CHAT
  // ================================
  const { conversation } = useConversationByBooking(bookingId);
  const serverConversationId = conversation?.conversationId ?? null;

  const conversationId =
    localConversationId ?? serverConversationId ?? null;

  useChatMessages(conversationId, "public");
  useChatStream(conversationId, "public");

  const chat = useChat(conversationId ?? "__none__");
  const send = useSendMessage(conversationId, bookingId, "public");

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length]);

  async function handleSend() {
    const body = message.trim();
    if (!body) return;

    const res = await send(body);

    if (!conversationId && res?.conversationId) {
      setLocalConversationId(res.conversationId);
    }

    setMessage("");
  }

  // ================================
  // FORMAT HELPERS
  // ================================
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatPrice(cents: number) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(cents / 100);
  }

  const firstAppointment: PublicBookingAppointmentItem | undefined =
    booking?.appointments[0];

  // ================================
  // UI
  // ================================
  return (
    <div className="flex h-full flex-col bg-white">

      {/* ================= HEADER ================= */}
      <div className="px-6 py-4 border-b border-black/5 flex items-center gap-4">

        <div className="h-14 w-14 rounded-2xl overflow-hidden shrink-0 bg-black/5">
          {booking?.branch.imageUrl && (
            <img
              src={booking.branch.imageUrl}
              alt={booking.branch.name}
              className="h-full w-full object-cover"
              loading="eager"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">

          <p className="text-base font-semibold truncate">
            {booking?.branch.name ?? "Sucursal"}
          </p>

          <p className="text-xs text-black/50 truncate">
            {booking?.branch.address}
          </p>

          {booking && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-black/60">

              <span>{formatDate(booking.date)}</span>

              {firstAppointment && (
                <>
                  <span className="text-black/30">•</span>
                  <span>{formatTime(firstAppointment.startIso)}</span>

                  <span className="text-black/30">•</span>

                  <span className="font-medium text-black/70">
                    {booking.appointments
                      .map((a) => a.service.name)
                      .join(", ")}
                  </span>
                </>
              )}
            </div>
          )}

          {firstAppointment?.staff && (
            <p className="text-xs text-black/40 mt-1">
              Con {firstAppointment.staff.name}
            </p>
          )}
        </div>
      </div>

      {/* ================= MESSAGES ================= */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {chat.messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              m.from === "CLIENT"
                ? "ml-auto bg-black text-white"
                : "bg-black/[0.05] text-black",
              m.pending && "opacity-50"
            )}
          >
            {m.body}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ================= INPUT ================= */}
      <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-white via-white/80 to-transparent">
        <div className="flex items-center gap-3 rounded-full bg-white/70 backdrop-blur-xl border border-black/10 shadow-lg px-4 py-2">

          <input
            type="text"
            placeholder="Escribe un mensaje..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-black/40"
          />

          <button
            onClick={handleSend}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-black text-white hover:scale-105 active:scale-95 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}