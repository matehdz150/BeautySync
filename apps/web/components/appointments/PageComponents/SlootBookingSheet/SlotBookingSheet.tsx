"use client";

import { useEffect, useMemo } from "react";
import { DateTime } from "luxon";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

import { useBranch } from "@/context/BranchContext";
import {
  SlotBookingProvider,
  useSlotBooking,
} from "@/context/SlotBookingContext";

import { StepPickFirstService } from "./steps/StepPickFirstService";
import { StepConfirmAddMore } from "./steps/StepConfirmAddMore";
import { StepReviewBooking } from "./steps/StepReviewBooking";

import { SlotBookingClientHeader } from "./SlotBookingClientHeader";
import { SlotBookingClientSelector } from "./SlotBookingClientSelector";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  pinnedStaffId: string | null;
  pinnedStartIso: string | null;
  pinnedStaffName: string | null;
};

function InnerSlotBookingSheet({
  open,
  onOpenChange,
  pinnedStaffId,
  pinnedStartIso,
  pinnedStaffName,
}: Props) {
  const { branch } = useBranch();
  const { state, actions } = useSlotBooking();

  /* ============================
     Init slot (solo al abrir)
  ============================ */
  useEffect(() => {
    if (!open) return;
    if (!branch?.id) return;
    if (!pinnedStaffId || !pinnedStartIso || !pinnedStaffName) return;

    actions.initSlot({
      branchId: branch.id,
      pinnedStaffId,
      pinnedStaffName,
      pinnedStartIso,
    });
  }, [open, branch?.id, pinnedStaffId, pinnedStaffName, pinnedStartIso]);

  /* ============================
     Title
  ============================ */
  const title = useMemo(() => {
    if (!pinnedStartIso) return "Nueva cita";

    const dt = DateTime.fromISO(pinnedStartIso).setLocale("es");
    return `Nueva cita · ${dt.toFormat("ccc dd 'de' LLL")} · ${dt.toFormat(
      "HH:mm"
    )}`;
  }, [pinnedStartIso]);

  const isFirstStepWithoutService = useMemo(() => {
    return state.step === 1 && state.services.length === 0;
  }, [state.step, state.services.length]);

  /* ============================
     Steps
  ============================ */
  function renderStep() {
    switch (state.step) {
      case 1:
        return <StepPickFirstService />;
      case 2:
        return <StepConfirmAddMore />;
      case 3:
        return <StepReviewBooking />;
      default:
        return null;
    }
  }

  const hasUnassignedStaff = useMemo(
    () => state.services.some((s) => s.staffId === "ANY"),
    [state.services]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="
          w-full !max-w-[32rem]
          bg-white p-0
          flex flex-col
          h-[100dvh]
        "
      >
        {/* ================= HEADER ================= */}
        <div className=" shrink-0 bg-white">
          <SheetHeader className=" space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <SheetTitle className="text-xl font-semibold tracking-tight px-3">
                {title}
              </SheetTitle>

              <p className="text-sm text-muted-foreground px-3">
                Configura los detalles de la cita
              </p>
            </div>

            {/* Client header */}
            <div className="pt-2 ">
              <SlotBookingClientHeader />
            </div>
          </SheetHeader>
        </div>

        {/* ================= BODY ================= */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {state.isSelectingClient ? (
            /* 🔥 CLIENT SELECTOR = FULL HEIGHT */
            <div className="h-full flex flex-col">
              {branch && (
                <SlotBookingClientSelector
                  orgId={branch.organizationId}
                  clientId={state.client?.id}
                  onSelect={(client) => actions.setClient(client)}
                  onClose={() => actions.closeClientSelector()}
                />
              )}
            </div>
          ) : (
            /* 🔁 NORMAL FLOW */
            <div className="h-full overflow-y-auto px-6 py-6">
              {renderStep()}
            </div>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        {!state.isSelectingClient && (
          <div className="border-t shrink-0 px-6 py-4 flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={() => {
                actions.reset();
                onOpenChange(false);
              }}
            >
              Cancelar
            </Button>

            {state.step < 3 && (
              <div className="flex flex-col items-end gap-1">
                <Button
                  onClick={() => actions.nextStep()}
                  disabled={hasUnassignedStaff || isFirstStepWithoutService}
                >
                  Continuar
                </Button>

                {hasUnassignedStaff && (
                  <span className="text-xs text-destructive">
                    Please assign a staff member to all services
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function SlotBookingSheet(props: Props) {
  return (
    <SlotBookingProvider>
      <InnerSlotBookingSheet {...props} />
    </SlotBookingProvider>
  );
}

export default SlotBookingSheet;
