"use client";

import { Calendar, Scissors, Star, User, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  branchName: string;
  coverUrl?: string | null;
  rating: number;
  comment?: string | null;
  bookingDate?: string;
  servicesSummary?: string;
  staffSummary?: string;
  onClose?: () => void;
};

function StarsRow({ value }: { value: number }) {
  const rounded = Math.round(value * 2) / 2;

  return (
    <div className="flex items-center justify-center gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const full = rounded >= i;
        const half = !full && rounded >= i - 0.5;

        if (full) {
          return (
            <Star
              key={i}
              className="h-7 w-7 fill-amber-400 text-amber-400"
            />
          );
        }

        if (half) {
          return (
            <div key={i} className="relative h-7 w-7">
              <Star className="absolute inset-0 h-7 w-7 text-muted-foreground/30" />
              <div className="absolute inset-0 w-1/2 overflow-hidden">
                <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
              </div>
            </div>
          );
        }

        return (
          <Star
            key={i}
            className="h-7 w-7 text-muted-foreground/30"
          />
        );
      })}
    </div>
  );
}

function MetaRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <div className="min-w-0 truncate">{children}</div>
    </div>
  );
}

export function RatingPanelReview({
  branchName,
  coverUrl,
  rating,
  comment,
  bookingDate,
  servicesSummary,
  staffSummary,
  onClose,
}: Props) {
  return (
    <div className="mx-auto w-full max-w-[520px] px-4">
      <div className="overflow-hidden rounded-3xl bg-white">
        <div className="p-6 text-center">
          {/* Logo / Cover pequeño */}
          {coverUrl && (
            <div className="mb-4 flex justify-center">
              <div className="relative h-25 w-25 overflow-hidden rounded-2xl border border-black/5 ">
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
            ¡Gracias por tu reseña!
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Tu opinión sobre <span className="font-medium">{branchName}</span> ya
            fue registrada
          </p>

          {/* Status badge */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-xs font-medium text-black">
              <Check className="h-4 w-4" />
              Reseña enviada correctamente
            </div>
          </div>

          {/* Stars */}
          <div className="mt-6">
            <StarsRow value={rating} />
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {rating.toFixed(1)} / 5
            </p>
          </div>

          {/* Comment */}
          {comment ? (
            <blockquote className="mt-6 rounded-2xl bg-muted/40 p-4 text-sm text-black/70">
              <span className="block text-xs font-medium text-muted-foreground">
                Tu comentario
              </span>
              <span className="mt-1 block leading-relaxed">
                “{comment}”
              </span>
            </blockquote>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed bg-black/[0.02] p-4 text-center text-xs text-muted-foreground">
              No dejaste comentario (opcional).
            </div>
          )}

          {/* Booking meta */}
          {(bookingDate || servicesSummary || staffSummary) && (
            <div className="mt-6 rounded-2xl bg-muted/40 p-4 text-xs text-muted-foreground">
              <div className="mx-auto flex max-w-[420px] flex-col gap-2 text-left">
                {bookingDate && (
                  <MetaRow icon={<Calendar className="h-3.5 w-3.5" />}>
                    {bookingDate}
                  </MetaRow>
                )}

                {servicesSummary && (
                  <MetaRow icon={<Scissors className="h-3.5 w-3.5" />}>
                    {servicesSummary}
                  </MetaRow>
                )}

                {staffSummary && (
                  <MetaRow icon={<User className="h-3.5 w-3.5" />}>
                    Atendido por {staffSummary}
                  </MetaRow>
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          {onClose && (
            <Button
              className={cn(
                "mt-8 h-11 rounded-full px-10",
                "shadow-sm"
              )}
              onClick={onClose}
            >
              Volver a mis citas
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}