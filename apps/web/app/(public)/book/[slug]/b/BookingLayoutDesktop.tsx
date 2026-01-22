"use client";

import { BookingStepIndicator } from "@/components/book/StepIndicator";
import { BookingRightSummary } from "@/components/book/BookingRightSummary";
import { Button } from "@/components/ui/button";
import type { BookingLayoutRenderProps } from "./BookingLayoutBase";

export function BookingLayoutDesktopShell({
  children,
  selectedServicesCount,
  formattedTotal,
  canContinue,
  isConfirmStep,
  handleContinue,
  isContinueDisabled
}: BookingLayoutRenderProps) {
  return (
    <div className="min-h-[60vh] bg-transparent flex flex-col">
      {/* HEADER */}
      <div>
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <BookingStepIndicator />
        </div>
      </div>

      {/* CONTENT */}
      <main className="flex-1 w-full px-6 lg:px-12 pt-5 pb-32">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12">
          {/* LEFT */}
          <div className="min-w-0">{children}</div>

          {/* RIGHT SUMMARY */}
          <aside className="hidden lg:block">
            <BookingRightSummary onContinue={handleContinue} />
          </aside>
        </div>
      </main>

      {/* FOOTER */}
      {!isConfirmStep && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-4 flex items-center justify-between gap-6">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                {selectedServicesCount} servicio(s)
              </span>
              <span className="text-lg font-semibold">
                Total: {formattedTotal}
              </span>
            </div>

            <Button
              size="lg"
              className="rounded-full px-8 py-6 shrink-0"
              disabled={isContinueDisabled}
              onClick={handleContinue}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}