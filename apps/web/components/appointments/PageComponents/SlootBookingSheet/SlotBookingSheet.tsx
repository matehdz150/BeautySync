"use client";

import { useEffect, useMemo, useRef } from "react";
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

// Steps (vamos a ir creándolos)
import { StepPickFirstService } from "./steps/StepPickFirstService";
import { StepConfirmAddMore } from "./steps/StepConfirmAddMore";
import { StepReviewBooking } from "./steps/StepReviewBooking";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  pinnedStaffId: string | null;
  pinnedStartIso: string | null;
};

function InnerSlotBookingSheet({
  open,
  onOpenChange,
  pinnedStaffId,
  pinnedStartIso,
}: Props) {
  const { branch } = useBranch();
  const { state, actions } = useSlotBooking();

  // ============================
  // Init slot ONLY once when opening
  // ============================
  useEffect(() => {
    if (!open) return;
    if (!branch?.id) return;
    if (!pinnedStaffId) return;
    if (!pinnedStartIso) return;

    actions.initSlot({
      branchId: branch.id,
      pinnedStaffId,
      pinnedStartIso,
    });
  }, [open, branch?.id, pinnedStaffId, pinnedStartIso]); // 👈 actions NO es necesaria

  // ============================
  // Title
  // ============================
  const title = useMemo(() => {
    if (!pinnedStartIso) return "New booking";

    const dt = DateTime.fromISO(pinnedStartIso);
    return `New booking · ${dt.toFormat("ccc dd LLL")} · ${dt.toFormat("HH:mm")}`;
  }, [pinnedStartIso]);

  // ============================
  // Render step
  // ============================
  function renderStep() {
    switch (state.step) {
      case 1:
        return <StepPickFirstService />;
      case 2:
        return <StepConfirmAddMore />;
      case 3:
        return <StepReviewBooking/>;
      default:
        return null;
    }
  }

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
        {/* HEADER */}
        <div className="border-b shrink-0">
          <SheetHeader className="px-6 py-4">
            <SheetTitle className="text-xl">{title}</SheetTitle>
          </SheetHeader>
        </div>

        {/* BODY */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
          {renderStep()}
        </div>

        {/* FOOTER */}
        <div className="border-t shrink-0 px-6 py-4 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              actions.reset();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
        </div>
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
