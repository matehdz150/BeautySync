"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BookingHeader({
  imageUrl,
  title,
  onClose,
}: {
  imageUrl: string | null;
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-black/[0.02]",
        "h-[170px] sm:h-[240px] lg:h-[280px]"
      )}
    >
      {imageUrl ? (
        <>
          <Image src={imageUrl} alt={title} fill className="object-cover" unoptimized/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      )}

      <div className="absolute right-4 top-4">
        <Button
          size="icon"
          variant="outline"
          onClick={onClose}
          className="h-10 w-10 rounded-full bg-white/20 text-white"
        >
          <X />
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 right-4">
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
      </div>
    </div>
  );
}