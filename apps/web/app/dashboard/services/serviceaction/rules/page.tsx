"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useServiceDraft } from "@/context/ServiceDraftContext";

export default function ServiceRulesPage() {
  const { state, dispatch } = useServiceDraft();

  function addRule() {
    dispatch({
      type: "ADD_RULE",
      value: "",
    });
  }

  function updateRule(index: number, text: string) {
    // igual que notas: update por remove + add
    dispatch({ type: "REMOVE_RULE", index });
    dispatch({ type: "ADD_RULE", value: text });
  }

  function removeRule(index: number) {
    dispatch({ type: "REMOVE_RULE", index });
  }

  return (
    <div className="space-y-8 pr-10">
      <section className="bg-white rounded-2xl">
        <h2 className="text-2xl font-semibold mb-3">Reglas especiales</h2>

        <p className="text-sm text-gray-500 mb-6">
          Define condiciones o requisitos para ofrecer este servicio.
          Estas reglas son internas y visibles solo para tu equipo.
        </p>

        {/* ADD RULE BUTTON */}
        <Button
          onClick={addRule}
          className="bg-indigo-500 text-white hover:bg-indigo-600"
        >
          Agregar regla
        </Button>

        {/* RULES LIST */}
        <div className="mt-6 space-y-4">
          {state.serviceRules.length === 0 && (
            <p className="text-sm text-gray-400">
              Aún no has agregado ninguna regla.
            </p>
          )}

          {state.serviceRules.map((rule, i) => (
            <div
              key={i}
              className="border rounded-xl p-4 space-y-2"
            >
              <div className="flex justify-between text-xs text-gray-500">
                <Label className="font-medium text-gray-800">
                  Regla especial
                </Label>

                <button
                  onClick={() => removeRule(i)}
                  className="text-red-500 hover:underline"
                >
                  Eliminar
                </button>
              </div>

              <Input
                value={rule}
                onChange={(e) => updateRule(i, e.target.value)}
                maxLength={150}
                placeholder="Ej. El cliente debe llegar 10 min antes"
                className="h-12 shadow-none"
              />

              <p className="text-[11px] text-gray-400">
                {rule.length}/150 caracteres
              </p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-gray-500 mt-2">
          Estas reglas ayudan a tu equipo a seguir un mismo estándar.
        </p>
      </section>

      <div className="mb-20" />
    </div>
  );
}