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
  const router = useRouter();

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
    <div className="space-y-6 overflow-y-scroll w-full">
      <div className="flex items-center gap-4 mb-6 mt-10">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="
      flex items-center gap-2
      px-4 py-2
      border rounded-full
      text-sm
      hover:bg-gray-50
      transition
      bg-white
    "
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        {/* Breadcrumb */}
        <div className="text-sm text-muted-foreground">
          <span>Configuración del negocio</span>
          <span className="mx-2">›</span>
          <span className="text-foreground font-medium">Políticas</span>
        </div>
      </div>
      {/* 🔥 BOOKING RULES */}
      <section className="bg-white rounded-2xl border p-6 space-y-6 mr-10">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">Reglas de reservación</h2>
            <p className="text-sm text-muted-foreground">
              Controla cuándo los clientes pueden reservar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Anticipación mínima</Label>
            <HourSelect
              value={form.minBookingNoticeMin}
              onChange={(v) => setForm({ ...form, minBookingNoticeMin: v })}
            />
          </div>

          <div className="space-y-2">
            <Label>Reservar hasta</Label>
            <HourSelect
              value={form.maxBookingAheadDays * 60}
              onChange={(v) =>
                setForm({
                  ...form,
                  maxBookingAheadDays: v / 60,
                })
              }
            />
          </div>
        </div>
      </section>

      {/* 🔥 CANCELLATION RULES */}
      <section className="bg-white rounded-2xl border p-6 space-y-6 mr-10">
        <h2 className="text-lg font-semibold">
          Cancelaciones y reagendaciones
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Cancelación mínima</Label>
            <HourSelect
              value={form.cancelationWindowMin}
              onChange={(v) => setForm({ ...form, cancelationWindowMin: v })}
            />
          </div>

          <div className="space-y-2">
            <Label>Reagendar mínimo</Label>
            <HourSelect
              value={form.rescheduleWindowMin}
              onChange={(v) => setForm({ ...form, rescheduleWindowMin: v })}
            />
          </div>
        </div>
      </section>

      {/* 🔥 BUFFERS */}
      <section className="bg-white rounded-2xl border p-6 space-y-6 mr-10">
        <h2 className="text-lg font-semibold">Buffers entre citas</h2>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Buffer antes</Label>
            <HourSelect
              value={form.bufferBeforeMin}
              onChange={(v) => setForm({ ...form, bufferBeforeMin: v })}
            />
          </div>

          <div className="space-y-2">
            <Label>Buffer después</Label>
            <HourSelect
              value={form.bufferAfterMin}
              onChange={(v) => setForm({ ...form, bufferAfterMin: v })}
            />
          </div>
        </div>
      </section>

      {/* SAVE BUTTON */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="px-8">
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

function hourOptions() {
  const options = [];
  for (let h = 1; h <= 24; h += 2) {
    options.push({
      label: `${h} ${h === 1 ? "hora" : "horas"}`,
      value: h * 60,
    });
  }
  return options;
}

function HourSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const options = hourOptions();

  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={String(o.value)}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
