"use client";

import { useEffect, useState } from "react";
import { useBranch } from "@/context/BranchContext";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  getBranchSettings,
  updateBranchSettings,
} from "@/lib/services/branches";

export default function BranchSettingsPage() {
  const { branch } = useBranch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    timezone: "America/Mexico_City",
    minBookingNoticeMin: 0,
    maxBookingAheadDays: 60,
    cancelationWindowMin: 120,
    rescheduleWindowMin: 480,
    bufferBeforeMin: 0,
    bufferAfterMin: 0,
  });

  // 🔥 Load settings
  useEffect(() => {
    if (!branch) return;

    async function load() {
      try {
        const res = await getBranchSettings(branch.id);

        if (res?.settings) {
          setForm({
            timezone: res.settings.timezone,
            minBookingNoticeMin: res.settings.minBookingNoticeMin ?? 0,
            maxBookingAheadDays: res.settings.maxBookingAheadDays ?? 60,
            cancelationWindowMin: res.settings.cancelationWindowMin ?? 120,
            rescheduleWindowMin: res.settings.rescheduleWindowMin ?? 480,
            bufferBeforeMin: res.settings.bufferBeforeMin ?? 0,
            bufferAfterMin: res.settings.bufferAfterMin ?? 0,
          });
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [branch]);

  async function handleSave() {
    if (!branch) return;

    setSaving(true);

    try {
      await updateBranchSettings(branch.id, form);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="space-y-6 overflow-y-scroll">
      {/* 🔥 BOOKING RULES */}
      <section className="bg-white rounded-2xl px-6 py-6">
        <h2 className="text-2xl font-semibold mb-6">
          Reglas de reservación
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {/* Min Notice */}
          <div className="space-y-2">
            <Label>Anticipación mínima (minutos)</Label>
            <Input
              type="number"
              value={form.minBookingNoticeMin}
              onChange={(e) =>
                setForm({
                  ...form,
                  minBookingNoticeMin: Number(e.target.value),
                })
              }
            />
            <p className="text-xs text-gray-500">
              Tiempo mínimo antes de que un cliente pueda reservar.
            </p>
          </div>

          {/* Max Ahead */}
          <div className="space-y-2">
            <Label>Reservar hasta (días)</Label>
            <Input
              type="number"
              value={form.maxBookingAheadDays}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxBookingAheadDays: Number(e.target.value),
                })
              }
            />
            <p className="text-xs text-gray-500">
              Cuántos días hacia adelante pueden reservar.
            </p>
          </div>
        </div>
      </section>

      {/* 🔥 CANCELLATION RULES */}
      <section className="bg-white rounded-2xl px-6 py-6">
        <h2 className="text-xl font-semibold mb-6">
          Cancelaciones y reagendaciones
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Ventana de cancelación (minutos)</Label>
            <Input
              type="number"
              value={form.cancelationWindowMin}
              onChange={(e) =>
                setForm({
                  ...form,
                  cancelationWindowMin: Number(e.target.value),
                })
              }
            />
            <p className="text-xs text-gray-500">
              Tiempo mínimo antes de la cita para poder cancelar.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ventana de reagendación (minutos)</Label>
            <Input
              type="number"
              value={form.rescheduleWindowMin}
              onChange={(e) =>
                setForm({
                  ...form,
                  rescheduleWindowMin: Number(e.target.value),
                })
              }
            />
            <p className="text-xs text-gray-500">
              Tiempo mínimo antes de la cita para poder reagendar.
            </p>
          </div>
        </div>
      </section>

      {/* 🔥 BUFFERS */}
      <section className="bg-white rounded-2xl px-6 py-6">
        <h2 className="text-xl font-semibold mb-6">
          Buffers entre citas
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Buffer antes (minutos)</Label>
            <Input
              type="number"
              value={form.bufferBeforeMin}
              onChange={(e) =>
                setForm({
                  ...form,
                  bufferBeforeMin: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Buffer después (minutos)</Label>
            <Input
              type="number"
              value={form.bufferAfterMin}
              onChange={(e) =>
                setForm({
                  ...form,
                  bufferAfterMin: Number(e.target.value),
                })
              }
            />
          </div>
        </div>
      </section>

      {/* SAVE BUTTON */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="px-8"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}