"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  branchName: string;
  onSubmit?: (rating: number, comment?: string) => void;
  bookingDate?: string;
  servicesSummary?: string;
  staffSummary?: string;
};

export function RatingModal({
  open,
  onClose,
  branchName,
  onSubmit,
  bookingDate,
  servicesSummary,
  staffSummary,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const isPointerDown = useRef(false);

  useEffect(() => setMounted(true), []);

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

  if (!open || !mounted) return null;

  const current = hoverRating ?? rating ?? 0;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-black/5 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Star className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              Califica tu experiencia
            </h3>
            <p className="text-sm text-muted-foreground">{branchName}</p>
          </div>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          

          {/* Rating label */}
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Tu calificación
          </p>

          {/* Stars */}
          <div
            ref={containerRef}
            className="flex justify-center gap-2 rounded-2xl bg-muted/40 p-4 select-none"
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
                <div
                  key={star}
                  className="relative cursor-pointer"
                  onClick={() => {
                    setRating(star);       // 👈 click = entero
                    setHoverRating(null);
                  }}
                >
                  {type === "full" && (
                    <Star className="h-9 w-9 fill-yellow-400 text-yellow-400" />
                  )}

                  {type === "half" && (
                    <div className="relative h-9 w-9">
                      <Star className="absolute inset-0 h-9 w-9 text-muted-foreground/30" />
                      <div className="absolute inset-0 w-1/2 overflow-hidden">
                        <Star className="h-9 w-9 fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                  )}

                  {type === "empty" && (
                    <Star className="h-9 w-9 text-muted-foreground/30" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Numeric */}
          <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
            {rating
              ? `${rating.toFixed(1)} / 5`
              : "Haz clic o arrastra para calificar"}
          </p>

          {/* Comment */}
          <div className="mt-5">
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Comentario (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={200}
              placeholder="Cuéntanos un poco más…"
              className="w-full rounded-xl border bg-background p-3 text-sm focus:ring-2 focus:ring-primary"

            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {comment.length}/200
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t p-5">
          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 rounded-full"
            disabled={!rating}
            onClick={() => {
              if (!rating) return;
              onSubmit?.(rating, comment);
              onClose();
            }}
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}