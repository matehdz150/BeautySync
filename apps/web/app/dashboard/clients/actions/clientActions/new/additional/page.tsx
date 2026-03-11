"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { useClientDraft } from "@/context/ClientDraftContext";


export default function ClientAdditionalInfoPage() {
  const { state, dispatch } = useClientDraft();

  return (
    <div className="space-y-6 px-3 py-5">
      {/* TITLE */}
      <div>
        <h2 className="text-2xl font-semibold">Información adicional</h2>
        <p className="text-sm text-muted-foreground">
          Información complementaria del cliente
        </p>
      </div>

      {/* CARD */}
      <div className="rounded-md bg-white overflow-hidden">
        <div className="p-6 space-y-8">

          {/* CIUDAD / OCUPACIÓN */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="font-medium text-gray-800">
                Ciudad (Opcional)
              </Label>

              <Input
                className="h-12 shadow-none"
                placeholder="Ciudad"
                value={state.profile?.city ?? ""}
                onChange={(e) =>
                  dispatch({
                    type: "SET_CITY",
                    value: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-gray-800">
                Ocupación (Opcional)
              </Label>

              <Input
                className="h-12 shadow-none"
                placeholder="Ocupación"
                value={state.profile?.occupation ?? ""}
                onChange={(e) =>
                  dispatch({
                    type: "SET_OCCUPATION",
                    value: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* GÉNERO / FECHA NACIMIENTO */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="font-medium text-gray-800">
                Género (Opcional)
              </Label>

              <Input
                className="h-12 shadow-none"
                placeholder="Género"
                value={state.profile?.gender ?? ""}
                onChange={(e) =>
                  dispatch({
                    type: "SET_GENDER",
                    value: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-gray-800">
                Fecha de nacimiento (Opcional)
              </Label>

              <Input
                type="date"
                className="h-12 shadow-none"
                value={state.birthdate ?? ""}
                onChange={(e) =>
                  dispatch({
                    type: "SET_BIRTHDATE",
                    value: e.target.value,
                  })
                }
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}