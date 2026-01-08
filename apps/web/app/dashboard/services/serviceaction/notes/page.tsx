"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useServiceDraft } from "@/context/ServiceDraftContext";

export default function ServiceNotesPage() {
  const { state, dispatch } = useServiceDraft();

  function addNote() {
    dispatch({
      type: "ADD_NOTE",
      value: "",
    });
  }

  function updateNote(index: number, text: string) {
    // Reemplazar estilo reducer: remove + add
    dispatch({ type: "REMOVE_NOTE", index });
    dispatch({ type: "ADD_NOTE", value: text });
  }

  function removeNote(index: number) {
    dispatch({ type: "REMOVE_NOTE", index });
  }

  return (
    <div className="space-y-8 pr-10">
      <section className="bg-white rounded-2xl">
        <h2 className="text-2xl font-semibold mb-3">Notas del servicio</h2>

        <p className="text-sm text-gray-500 mb-6">
          Estas notas son internas y visibles solo para tu equipo.
        </p>

        {/* BUTTON ADD NOTE */}
        <Button
          onClick={addNote}
          className="bg-indigo-500 text-white hover:bg-indigo-600"
        >
          Agregar nota
        </Button>

        {/* NOTES LIST */}
        <div className="mt-6 space-y-4">
          {state.notes.length === 0 && (
            <p className="text-sm text-gray-400">
              Aún no has agregado ninguna nota.
            </p>
          )}

          {state.notes.map((text, i) => (
            <div key={i} className="border rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <Label className="font-medium text-gray-800">
                  Nota interna
                </Label>

                <button
                  onClick={() => removeNote(i)}
                  className="text-red-500 hover:underline"
                >
                  Eliminar
                </button>
              </div>

              <Textarea
                rows={6}
                value={text}
                onChange={(e) => updateNote(i, e.target.value)}
                maxLength={1000}
                className="resize-none shadow-none"
                placeholder="Escribe tu nota aquí…"
              />

              <p className="text-[11px] text-gray-400">
                {text.length}/1000 caracteres
              </p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-gray-500 mt-2">
          Estas notas no serán visibles para los clientes.
        </p>
      </section>

      <div className="mb-20" />
    </div>
  );
}