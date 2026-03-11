"use client";

import { useRouter } from "next/navigation";
import { deleteClient } from "@/lib/services/clients";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import { ChevronDown, MoreHorizontal, Pencil, Trash } from "lucide-react";

type Props = {
  clientId: string;
};

export default function ClientActionsDropdown({ clientId }: Props) {
  const router = useRouter();

  async function handleDelete() {
    const confirm = window.confirm(
      "¿Seguro que quieres eliminar este cliente?",
    );

    if (!confirm) return;

    try {
      await deleteClient(clientId);

      router.refresh();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el cliente");
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
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            router.push(
              `/dashboard/clients/actions/clientActions/edit/${clientId}`,
            );
          }}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Editar
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="text-red-600 focus:text-red-600"
        >
          <Trash className="w-4 h-4 mr-2" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
