"use client";

import { useState, useEffect, useRef } from "react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { CategoryPicker } from "@/components/services/CreateServicePage/CategoryPicker";

import { useBranch } from "@/context/BranchContext";
import { getServiceCategories } from "@/lib/services/service-categories";
import { getStaffByBranch } from "@/lib/services/staff";
import { StaffSelect } from "@/components/services/CreateServicePage/StaffSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServiceDraft } from "@/context/ServiceDraftContext";

export default function NewServiceBasicInfo() {
  // --- 🔥 STATE ---
  const { branch } = useBranch();
  const { state, dispatch } = useServiceDraft();

  const {
    openCategoryPicker,
    setOpenCategoryPicker,
    openDurationPicker,
    setOpenDurationPicker,
  } = useServiceDraft();

  const [categories, setCategories] = useState<any[]>([]);

  const [staff, setStaff] = useState<any[]>([]);

  const priceDisplay =
    typeof state.priceCents === "number" && !Number.isNaN(state.priceCents)
      ? state.priceCents / 100
      : "";

  // --- 🔥 LOAD CATEGORIES ---
  useEffect(() => {
    if (!branch) return;

    async function load() {
      setCategories(await getServiceCategories());
    }

    load();
  }, [branch]);

  useEffect(() => {
    if (!branch) return;

    async function load() {
      setCategories(await getServiceCategories());
      setStaff(await getStaffByBranch(branch.id));
    }

    load();
  }, [branch]);

  return (
    <div className="space-y-5 overflow-y-scroll">
      <section className="bg-white rounded-2xl">
        <h2 className="text-2xl font-semibold mb-6">Información básica</h2>

        <div className="space-y-6 px-3">
          {/* Nombre */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <Label className="font-medium text-gray-800">
                Nombre del servicio
              </Label>
              <span>0/255</span>
            </div>

            <Input
              className="h-14 shadow-none"
              placeholder="Añade un nombre de servicio, por ejemplo, corte de pelo para hombre"
              value={state.name}
              onChange={(e) =>
                dispatch({ type: "SET_NAME", value: e.target.value })
              }
              id="service-name"
            />
          </div>

          {/* Tipo / Categoria */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <StaffSelect
                staff={staff}
                value={state.staffIds}
                onChange={(ids) => dispatch({ type: "SET_STAFF", value: ids })}
                label="Asignar miembro del equipo"
                placeholder="Asigna a un miembro del equipo"
              />

              <p className="text-[11px] text-gray-500 mt-1">
                Ayuda a los clientes a encontrar tu servicio
              </p>
            </div>

            {/* 🔥 CATEGORY PICKER REAL */}
            <div id="service-category">
              <CategoryPicker
                categories={categories}
                value={state.categoryId}
                onChange={(id) => dispatch({ type: "SET_CATEGORY", value: id })}
                label="Categoría"
                externalOpen={openCategoryPicker}
                onOpenChange={setOpenCategoryPicker}
              />

              <p className="text-[11px] text-gray-500 mt-1">
                La categoría que verán online
              </p>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <Label className="font-medium text-gray-800">
                Descripción (Opcional)
              </Label>
              <span>{state.description.length}/1000</span>
            </div>

            <Textarea
              rows={40}
              className="resize-none shadow-none h-40"
              placeholder="Añade una breve descripción del servicio"
              value={state.description}
              onChange={(e) =>
                dispatch({ type: "SET_DESCRIPTION", value: e.target.value })
              }
            />
          </div>
        </div>
      </section>

      {/* Precios y duración */}
      <section className="bg-white rounded-2xl px-3">
        <h2 className="text-lg font-semibold mb-4">Precios y duración</h2>

        <div className="grid grid-cols-2 gap-4">
          {/* PRECIO */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <Label className="font-medium text-gray-800">Precio</Label>
            </div>

            <div
              className="
    flex items-center gap-2 px-4 h-14 rounded-lg border
    focus-within:ring-2 focus-within:ring-indigo-400/50
    focus-within:border-indigo/50
    transition
  "
            >
              <span className="text-sm text-muted-foreground">MXN</span>

              <Input
                className="
      h-full shadow-none border-none outline-none
      focus-visible:ring-0 focus-visible:ring-offset-0
      px-0
    "
                placeholder="0.00"
                value={priceDisplay}
                onChange={(e) => {
                  const raw = e.target.value;

                  if (raw === "") {
                    dispatch({ type: "SET_PRICE", value: null });
                    return;
                  }

                  dispatch({
                    type: "SET_PRICE",
                    value: Math.round(Number(raw) * 100),
                  });
                }}
                id="service-price"
              />
            </div>

            <p className="text-[11px] text-gray-500 mt-1">
              Precio base del servicio (sin propinas).
            </p>
          </div>

          {/* DURACIÓN */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <Label className="font-medium text-gray-800">Duración</Label>
              <span>minutos</span>
            </div>

            <Select
              value={String(state.durationMin || "")}
              onValueChange={(v) =>
                dispatch({
                  type: "SET_DURATION",
                  value: Number(v),
                })
              }
              open={openDurationPicker}
              onOpenChange={setOpenDurationPicker}
            >
              <SelectTrigger
                className="py-7 w-full shadow-none"
                id="service-duration"
              >
                <SelectValue placeholder="Selecciona duración" />
              </SelectTrigger>

              <SelectContent
                side="top"
                position="popper"
                avoidCollisions={false}
                className=""
              >
                <SelectContent
                  side="top"
                  position="popper"
                  avoidCollisions={false}
                >
                  {Array.from({ length: 11 }).map((_, i) => {
                    const minutes = (i + 1) * 5; // 5,10,15...55
                    return (
                      <SelectItem
                        key={minutes}
                        value={String(minutes)}
                        className="px-5"
                      >
                        {minutes} min
                      </SelectItem>
                    );
                  })}

                  <SelectItem value="60" className="px-5">
                    1 hora
                  </SelectItem>
                </SelectContent>
              </SelectContent>
            </Select>

            <p className="text-[11px] text-gray-500 mt-1">
              Tiempo que se bloqueará en el calendario para este servicio.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
