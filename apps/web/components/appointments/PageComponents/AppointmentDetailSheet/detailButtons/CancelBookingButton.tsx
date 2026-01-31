"use client";

import { useState } from "react";
import {
  Loader2,
  RefreshCwOff,
  UserX,
  Briefcase,
  CalendarX,
  CloudRain,
  HelpCircle,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { cancelManagerBooking } from "@/lib/services/appointments";
import { buildBookingCancelledAlert } from "@/lib/ui/bookingAlerts";
import { useUIAlerts } from "@/context/UIAlertsContext";

type Props = {
  bookingId: string;
  clientName?: string | null;
  startIso: string;
};

const CANCEL_REASONS = [
  {
    value: "Cliente canceló",
    label: "Cliente canceló",
    icon: UserX,
  },
  {
    value: "Personal no disponible",
    label: "Personal no disponible",
    icon: Briefcase,
  },
  {
    value: "Error de agenda",
    label: "Error de agenda",
    icon: CalendarX,
  },
  {
    value: "Clima u otra causa externa",
    label: "Clima u otra causa externa",
    icon: CloudRain,
  },
  {
    value: "Otro",
    label: "Otro",
    icon: HelpCircle,
  },
];

export function CancelBookingButton({
  bookingId,
  clientName,
  startIso,
}: Props) {
  const { showAlert } = useUIAlerts();
  const [reason, setReason] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const selectedReason = CANCEL_REASONS.find((r) => r.value === reason);

  async function handleCancel() {
    try {
      setLoading(true);

      await cancelManagerBooking({
        bookingId,
        reason,
      });

      showAlert(
        buildBookingCancelledAlert({
          clientName,
          startIso,
        })
      );
    } finally {
      setLoading(false);
      setReason(undefined);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-12 w-12"
          tooltip="Cancelar"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCwOff className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="center"
        className="w-full max-w-[300px] space-y-2 p-3 bg-[#171717]"
      >
        <Label className="text-xs text-white">Motivos</Label>

        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="h-[25px] text-xs">
            {selectedReason ? (
              <div className="flex items-center gap-2">
                <selectedReason.icon className="h-3.5 w-3.5 text-white" />
                <span className="text-white">{selectedReason.label}</span>
              </div>
            ) : (
              <span className="text-white">Motivo (opcional)</span>
            )}
          </SelectTrigger>

          <SelectContent
            side="top"
            position="popper"
            sideOffset={6}
            className="text-xs"
          >
            {CANCEL_REASONS.map(({ value, label, icon: Icon }) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          className="
    w-full h-[32px] text-xs
    relative overflow-hidden
    bg-white text-foreground
    border border-input
    transition-all duration-300 ease-out
    hover:text-white hover:border-indigo-200
    hover:-translate-y-[1px]
    hover:shadow-md hover:shadow-indigo-200/30

    before:absolute before:inset-0
    before:bg-gradient-to-r
    before:from-indigo-400 before:to-indigo-400
    before:opacity-0
    before:transition-opacity before:duration-300
    hover:before:opacity-100
  "
        >
          <span className="relative z-10">Cancelar cita</span>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
