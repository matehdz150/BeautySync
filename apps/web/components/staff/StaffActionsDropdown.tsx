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

  async function handleDelete() {
    const ok = confirm("¿Seguro que quieres eliminar este staff?");
    if (!ok) return;

    try {
      await deleteStaff(staffId);

      router.refresh(); // refresca la tabla
    } catch (e) {
      console.error(e);
      alert("Error eliminando staff");
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

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
        >
          <Trash className="mr-2 w-4 h-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
