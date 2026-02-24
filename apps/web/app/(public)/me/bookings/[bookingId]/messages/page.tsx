"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BookingMessagePage() {
  const [message, setMessage] = useState("");

  // 🔥 Hardcoded booking info
  const bookingInfo = {
    branchName: "Studio Aura Polanco",
    branchAddress: "Av. Presidente Masaryk 123, CDMX",
    bookingDate: "Viernes 15 Marzo · 5:30 PM",
    service: "Corte + Styling",
    coverUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200",
  };

  const messages = [
    { id: 1, text: "Hola 👋", fromMe: false },
    { id: 2, text: "Hola, ¿puedo cambiar mi horario?", fromMe: true },
    { id: 3, text: "Claro, dime qué día te gustaría.", fromMe: false },
  ];

  return (
    <div className="flex h-full flex-col relative bg-white">
      
      {/* ===== HEADER ===== */}
      <div className="px-6 py-4 border-b border-black/5 flex items-center gap-4">
        
        {/* Avatar */}
        <div className="h-14 w-14 rounded-2xl overflow-hidden shrink-0">
          <img
            src={bookingInfo.coverUrl}
            alt={bookingInfo.branchName}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold truncate">
            {bookingInfo.branchName}
          </p>

          <p className="text-xs text-black/50 truncate">
            {bookingInfo.branchAddress}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-black/60">
            <span>{bookingInfo.bookingDate}</span>
            <span className="text-black/30">•</span>
            <span className="font-medium text-black/70">
              {bookingInfo.service}
            </span>
          </div>
        </div>
      </div>

      {/* ===== MESSAGES ===== */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              m.fromMe
                ? "ml-auto bg-black text-white"
                : "bg-black/[0.05] text-black"
            )}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* ===== INPUT BAR ===== */}
      <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-white via-white/80 to-transparent">
        <div className="relative">
          <div
            className="
              flex items-center gap-3
              rounded-full
              bg-white/70
              backdrop-blur-xl
              border border-black/10
              shadow-lg
              px-4 py-2
            "
          >
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="
                flex-1 bg-transparent outline-none
                text-sm
                placeholder:text-black/40
              "
            />

            <button
              className="
                flex items-center justify-center
                h-9 w-9
                rounded-full
                bg-black
                text-white
                transition
                hover:scale-105
                active:scale-95
              "
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}