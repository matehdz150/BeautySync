"use client";

import { BookingStepIndicator } from "@/components/book/StepIndicator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookingLayoutRenderProps } from "./BookingLayoutBase";

export function BookingLayoutMobileShell({
  children,
  selectedServicesCount,
  formattedTotal,
  canContinue,
  isConfirmStep,
  handleContinue,
  isContinueDisabled
}: BookingLayoutRenderProps) {
  return (
    <div className="min-h-dvh bg-white flex flex-col w-full">
      {/* HEADER */}
      <div className="px-4 pt-4 shrink-0">
        <BookingStepIndicator />
      </div>

      {/* CONTENT */}
      <main
        className={cn(
          "flex-1 w-full overflow-y-auto px-4 pt-5",
          !isConfirmStep ? "pb-28" : "pb-6"
        )}
      >
        {children}
      </main>

      {/* BOTTOM BAR FIXED */}
      {!isConfirmStep && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white backdrop-blur-md">
          <div className="px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {selectedServicesCount} servicio(s)
                </p>
                <p className="text-lg font-semibold leading-tight truncate">
                  Total: {formattedTotal}
                </p>
              </div>

              <Button
                size="lg"
                className="rounded-full px-7 py-6 shrink-0 font-semibold"
                disabled={isContinueDisabled}
                onClick={handleContinue}
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}