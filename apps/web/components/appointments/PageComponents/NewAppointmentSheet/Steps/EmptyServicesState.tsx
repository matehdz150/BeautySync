"use client";

import { Plus, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function EmptyServicesState() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 border rounded-2xl bg-white text-center">
      <div className="h-14 w-14 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-500 text-2xl">
        <Scissors/>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold">
          No hay servicios registrados
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Aún no has creado ningún servicio. Agrega uno para poder asignarlo al
          staff y comenzar a recibir citas.
        </p>
      </div>

      <Button
        className="mt-2 shadow-none"
        onClick={() => router.push("/dashboard/services/serviceaction")}
      >
        <Plus className="mr-2 h-4 w-4" />
        Crear servicio
      </Button>
    </div>
  );
}