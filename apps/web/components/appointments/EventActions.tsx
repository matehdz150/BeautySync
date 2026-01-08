import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Pencil, Trash, X } from "lucide-react"

export function EventActions({ onClose }: any) {
  return (
    <div className="flex items-center gap-2">

      {/* EDITAR */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline" className="shadow-none border-none">
            <Pencil className="w-4 h-4" />
          </Button>
        </TooltipTrigger>

        <TooltipContent
          sideOffset={8}
          className="
            bg-neutral-900 
            text-neutral-100 
            border border-neutral-800
            rounded-md 
            shadow-xl 
            px-3 py-1.5
            text-xs 
            font-medium
          "
        >
          Editar cita
        </TooltipContent>
      </Tooltip>


      {/* ELIMINAR */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline" className="shadow-none border-none">
            <Trash className="w-4 h-4" />
          </Button>
        </TooltipTrigger>

        <TooltipContent
          sideOffset={8}
          className="
            bg-neutral-900 
            text-neutral-100 
            border border-neutral-800
            rounded-md 
            shadow-xl 
            px-3 py-1.5
            text-xs 
            font-medium
          "
        >
          Eliminar cita
        </TooltipContent>
      </Tooltip>


      {/* CERRAR */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </TooltipTrigger>

        <TooltipContent
          sideOffset={8}
          className="
            bg-neutral-900 
            text-neutral-100 
            border border-neutral-800
            rounded-md 
            shadow-xl 
            px-3 py-1.5
            text-xs 
            font-medium
          "
        >
          Cerrar
        </TooltipContent>
      </Tooltip>

    </div>
  )
}