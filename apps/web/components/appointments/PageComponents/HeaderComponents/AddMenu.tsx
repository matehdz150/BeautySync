"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  CalendarPlus,
  Users,
  Lock,
  Tag,
  Wallet,
  ChevronDown,
} from "lucide-react";

export function AddMenu({
  onAppointment,
  onGroupAppointment,
  onBlockedTime,
  onSale,
  onQuickPayment,
}: {
  onAppointment: () => void;
  onGroupAppointment: () => void;
  onBlockedTime: () => void;
  onSale: () => void;
  onQuickPayment: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="rounded-full px-5 shadow-none">
          Add
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-56 rounded-xl shadow-md"
      >
        <DropdownMenuItem onClick={onAppointment} className="gap-2 py-2">
          <CalendarPlus className="w-4 h-4" />
          Appointment
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onGroupAppointment} className="gap-2 py-2">
          <Users className="w-4 h-4" />
          Group appointment
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onBlockedTime} className="gap-2 py-2">
          <Lock className="w-4 h-4" />
          Blocked time
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onSale} className="gap-2 py-2">
          <Tag className="w-4 h-4" />
          Sale
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onQuickPayment} className="gap-2 py-2">
          <Wallet className="w-4 h-4" />
          Quick payment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}