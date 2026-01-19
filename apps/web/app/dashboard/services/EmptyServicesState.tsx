"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Scissors, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function EmptyServicesState() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center h-[55vh] px-6">
      <Card className="w-full max-w-md border-none shadow-none">
        <CardContent className="flex flex-col items-center text-center gap-5 py-12">
          {/* ICON */}
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Scissors className="h-12 w-12" />
          </div>

          {/* TEXT */}
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              No hay servicios creados
            </h2>
            <p className="text-sm text-muted-foreground">
              Para comenzar a recibir citas necesitas agregar al menos
              un servicio.
            </p>
          </div>

          {/* CTA */}
          <Button
            size="lg"
            className="gap-2 mt-2"
            onClick={() =>
              router.push("/dashboard/services/serviceaction")
            }
          >
            <Plus className="h-4 w-4" />
            Agregar servicio
          </Button>

          {/* HINT */}
          <p className="text-xs text-muted-foreground">
            Podrás asignar duración, precio y staff.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}