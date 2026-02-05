"use client";

import { useRef, useState } from "react";
import { Calendar, Scissors, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  branchName: string;
  bookingDate?: string;
  coverUrl?: string;
  servicesSummary?: string;
  staffSummary?: string;
  onSubmit?: (rating: number, comment?: string) => void;
};

export function RatingPanel({
  branchName,
  bookingDate,
  servicesSummary,
  staffSummary,
  coverUrl,
  onSubmit,
}: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const isPointerDown = useRef(false);

  function clampAndRound(value: number) {
    const clamped = Math.min(Math.max(value, 0.5), 5);
    return Math.round(clamped * 2) / 2;
  }

  function updateRatingFromPointer(e: React.PointerEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.min(Math.max(x, 0), rect.width);
    setHoverRating(clampAndRound((x / rect.width) * 5));
  }

  const current = hoverRating ?? rating ?? 0;

  return (
    <div className="mx-auto my-16 w-full max-w-[520px]">
      <div className="px-6 text-center">
        {/* Cover */}
        {coverUrl && (
          <div className="mb-4 flex justify-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-black/5 shadow-sm">
              <img
                src={coverUrl}
                alt={branchName}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}
        {/* Headline */}
        <h2 className="text-2xl font-semibold tracking-tight">
          ¿Cómo fue tu experiencia en {branchName}?
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Nos encantaría conocer tu opinión
        </p>

        {/* Booking info */}
        {(bookingDate || servicesSummary || staffSummary) && (
          <div className="mt-4 flex flex-col items-center gap-2 text-xs text-muted-foreground">
            {bookingDate && (
              <div className="flex items-center gap-2 rounded-full bg-muted/40 px-4 py-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">{bookingDate}</span>
              </div>
            )}

            {(servicesSummary || staffSummary) && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {servicesSummary && (
                  <div className="flex items-center gap-1 rounded-full bg-muted/40 px-3 py-1.5">
                    <Scissors className="h-3.5 w-3.5" />
                    <span className="max-w-[240px] truncate">
                      {servicesSummary}
                    </span>
                  </div>
                )}

                {staffSummary && (
                  <div className="flex items-center gap-1 rounded-full bg-muted/40 px-3 py-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span className="truncate">{staffSummary}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stars */}
        <div
          ref={containerRef}
          className="mt-6 flex justify-center gap-3 select-none"
          onPointerDown={(e) => {
            isPointerDown.current = true;
            updateRatingFromPointer(e);
          }}
          onPointerMove={(e) =>
            isPointerDown.current && updateRatingFromPointer(e)
          }
          onPointerUp={() => {
            if (isPointerDown.current && hoverRating !== null) {
              setRating(hoverRating);
            }
            isPointerDown.current = false;
            setHoverRating(null);
          }}
          onPointerLeave={() => {
            if (!isPointerDown.current) setHoverRating(null);
          }}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            let type: "empty" | "half" | "full" = "empty";
            if (current >= star) type = "full";
            else if (current >= star - 0.5) type = "half";

            return (
              <button
                key={star}
                type="button"
                className="transition-transform hover:scale-110"
                onClick={() => {
                  setRating(star);
                  setHoverRating(null);
                }}
              >
                {type === "full" && (
                  <Star className="h-11 w-11 fill-indigo-500 text-indigo-500" />
                )}

                {type === "half" && (
                  <div className="relative h-11 w-11">
                    <Star className="absolute inset-0 h-11 w-11 text-muted-foreground/30" />
                    <div className="absolute inset-0 w-1/2 overflow-hidden">
                      <Star className="h-11 w-11 fill-indigo-500 text-indigo-500" />
                    </div>
                  </div>
                )}

                {type === "empty" && (
                  <Star className="h-11 w-11 text-muted-foreground/40" />
                )}
              </button>
            );
          })}
        </div>

        {/* Helper */}
        <p className="mt-2 text-sm text-muted-foreground">
          {rating ? `${rating.toFixed(1)} / 5` : "Selecciona una calificación"}
        </p>

        {/* Comment */}
        <div className="mt-6">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="¿Quieres agregar un comentario? (opcional)"
            className="w-full rounded-xl border bg-background p-3 text-sm focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* CTA */}
        <Button
          className="mt-6 rounded-full px-20 py-5"
          disabled={!rating}
          onClick={() => rating && onSubmit?.(rating, comment)}
        >
          Enviar
        </Button>
      </div>
    </div>
  );
}
