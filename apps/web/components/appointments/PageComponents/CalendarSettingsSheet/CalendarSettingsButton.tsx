"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { CalendarSettingsSheet } from "./CalendarSettingsSheet";

export function CalendarSettingsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="rounded-full shadow-none"
        tooltip="Ajustes del calendario"
        onClick={() => setOpen(true)}
      >
        <Settings className="w-4 h-4" />
      </Button>

      <CalendarSettingsSheet open={open} onOpenChange={setOpen} />
    </>
  );
}