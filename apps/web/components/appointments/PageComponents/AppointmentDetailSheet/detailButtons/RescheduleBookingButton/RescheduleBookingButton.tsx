"use client";

import { useState } from "react";
import { CalendarSync } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ReschedulePlanPicker } from "./ReschedulePlanPicker";

type Props = {
  booking: any; // luego tipamos fino
};

export function RescheduleBookingButton({ booking }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-12 w-12" tooltip="Reagendar">
          <CalendarSync className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="center"
        sideOffset={8}
        className="
    w-72
    p-4
    max-h-[32rem] 
    
  "
      >
        <ReschedulePlanPicker
          booking={booking}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
