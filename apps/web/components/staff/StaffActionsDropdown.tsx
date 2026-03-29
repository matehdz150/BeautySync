"use client";

import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { ChevronDown, Trash } from "lucide-react";
import { deleteStaff } from "@/lib/services/staff";
import { useRouter } from "next/navigation";

type Props = {
  staffId: string;
};

export function StaffActionsDropdown({ staffId }: Props) {
  const router = useRouter();

  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    try {
      setLoading(true);

      await deleteStaff(staffId);

      // 🔥 dispara update global
      window.dispatchEvent(new Event("staff:updated"));
    } catch (e) {
      console.error(e);
      alert("Error eliminando staff");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="rounded-2xl shadow-none"
          onClick={(e) => e.stopPropagation()}
        >
          Acciones
          <ChevronDown className="ml-2 w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        onClick={(e) => e.stopPropagation()}
        className="w-44"
      >
        {!confirming ? (
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => setConfirming(true)}
            onSelect={(e) => {
              e.preventDefault();
              setConfirming(true);
            }}
          >
            <Trash className="mr-2 w-4 h-4" />
            Desactivar
          </DropdownMenuItem>
        ) : (
          <div className="p-2 space-y-2">
            <p className="text-xs text-muted-foreground">Desactivar staff?</p>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                className="w-full"
                disabled={loading}
                onClick={handleDelete}
              >
                {loading ? "Eliminando..." : "Confirmar"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setConfirming(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
