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
import { useRouter } from "next/navigation";

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

  const router = useRouter()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="rounded-full px-5 shadow-none" variant={'primary'}>
          Agregar
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
          Cita
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onBlockedTime} className="gap-2 py-2">
          <Lock className="w-4 h-4" />
          Tiempo fuera
        </DropdownMenuItem>

        <DropdownMenuItem onClick={()=>router.push('/dashboard/order')} className="gap-2 py-2">
          <Tag className="w-4 h-4" />
          Venta
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}