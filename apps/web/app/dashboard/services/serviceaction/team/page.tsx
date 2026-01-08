"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { StaffSelect } from "@/components/services/CreateServicePage/StaffSelect";

import { useBranch } from "@/context/BranchContext";
import { getStaffByBranch } from "@/lib/services/staff";
import { useServiceDraft } from "@/context/ServiceDraftContext";

type Staff = {
  id: string;
  name: string;
  email?: string;
  photoUrl?: string;
};

export default function AssignTeamPage() {
  const { branch } = useBranch();
  const { state, dispatch } = useServiceDraft();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 cargar staff
  useEffect(() => {
    if (!branch) return;

    async function load() {
      setLoading(true);
      try {
        const result = await getStaffByBranch(branch.id);
        setStaff(result ?? []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [branch]);

  // 🔥 staff seleccionado basado en CONTEXTO
  const selected = staff.filter((s) => state.staffIds.includes(s.id));

  return (
    <div className="space-y-8 pr-10">
      <section className="bg-white rounded-2xl">
        <h2 className="text-2xl font-semibold mb-2">Equipo asignado</h2>

        <p className="text-sm text-gray-500 mb-6">
          Elige qué miembros del equipo pueden ofrecer este servicio.
        </p>

        {/* Selector */}
        <StaffSelect
          staff={staff}
          value={state.staffIds}
          onChange={(ids) => dispatch({ type: "SET_STAFF", value: ids })}
          label="Asignar miembro del equipo"
          placeholder="Selecciona miembros del equipo"
        />

        {/* Lista de staff asignado */}
        <div className="mt-8 space-y-3">
          <Label className="text-gray-700">Miembros asignados</Label>

          {!loading && selected.length === 0 && (
            <p className="text-sm text-gray-400">
              Aún no hay miembros asignados.
            </p>
          )}

          {selected.map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between border rounded-xl px-4 py-3"
            >
              {/* LEFT */}
              <div className="flex items-start gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={s.photoUrl ?? ""} />
                  <AvatarFallback>{s.name[0]}</AvatarFallback>
                </Avatar>

                <div>
                  <p className="text-sm font-semibold">{s.name}</p>

                  {s.email && (
                    <p className="text-xs text-gray-500">{s.email}</p>
                  )}
                </div>
              </div>

              {/* RIGHT */}
              <Button
                variant="ghost"
                className="bg-indigo-500 text-white hover:bg-indigo-600"
                size="sm"
                onClick={() =>
                  dispatch({
                    type: "SET_STAFF",
                    value: state.staffIds.filter((id) => id !== s.id),
                  })
                }
              >
                Quitar
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
