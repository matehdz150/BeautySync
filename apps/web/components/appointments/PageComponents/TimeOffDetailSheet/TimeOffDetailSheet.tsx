"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useCalendar, useCalendarActions } from "@/context/CalendarContext";

export function BlockDetailSheet() {
  const { state } = useCalendar();
  const { closeBlockDetail } = useCalendarActions();

  const open = state.BlockDetailOpen;
  const blockId = state.selectedBlockId;

  const timeoff = state.timeOffs.find(
    (t) => t.id === blockId
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setTimeout(() => {
            closeBlockDetail();
          }, 200);
        }
      }}
    >
      <SheetContent
        side="right"
        className="w-full !max-w-[30rem] flex flex-col bg-white"
      >
        <VisuallyHidden>
          <SheetTitle>Detalle bloqueo</SheetTitle>
        </VisuallyHidden>

        <div className="p-6 space-y-3">
          <p>ID: {timeoff?.id}</p>
          <p>Staff: {timeoff?.staffId}</p>
          <p>Inicio: {timeoff?.startISO}</p>
          <p>Fin: {timeoff?.endISO}</p>
          <p>Motivo: {timeoff?.reason ?? "Sin motivo"}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}