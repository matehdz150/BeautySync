"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublicAuth } from "@/context/public/PublicAuthContext";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { motion } from "framer-motion";

function getInitials(nameOrEmail?: string | null) {
  const raw = (nameOrEmail ?? "").trim();
  if (!raw) return "U";

  const parts = raw.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

type Gender = "MALE" | "FEMALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY";

export default function PublicProfilePage() {
  const router = useRouter();
  const { user } = usePublicAuth();

  // ✅ evita hydration mismatch en Radix (Select)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState(user?.name ?? "");
  const [email] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");

  const [birthdate, setBirthdate] = useState<string>("");
  const [gender, setGender] = useState<Gender | "">("");

  const [saving, setSaving] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatarUrl ?? null
  );

  const initials = useMemo(() => {
    return getInitials(fullName || user?.name || user?.email);
  }, [fullName, user?.name, user?.email]);

  function openFilePicker() {
    fileRef.current?.click();
  }

  async function onPickAvatar(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Selecciona una imagen válida");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen pesa demasiado (máx 5MB)");
      return;
    }

    const url = URL.createObjectURL(file);
    setAvatarPreview(url);

    // TODO: subir a backend
  }

  function removeAvatar() {
    setAvatarPreview(null);
    // TODO: borrar en backend
  }

  async function saveProfile() {
    if (saving) return;

    setSaving(true);
    try {
      // TODO: conectar endpoint real
      await new Promise((r) => setTimeout(r, 900));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-white">
      {/* Glow background (no rompe layout) */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 -z-10 rounded-full blur-3xl
        bg-gradient-to-b from-indigo-400/40 via-indigo-400/10 to-transparent"
        initial={{ opacity: 0, scale: 0.92, filter: "blur(90px)" }}
        animate={{
          opacity: 1,
          scale: [1, 1.03, 1],
          y: [0, 10, 0],
          filter: ["blur(50px)", "blur(58px)", "blur(50px)"],
        }}
        transition={{
          opacity: { duration: 1.2, ease: "easeOut" },
          scale: { duration: 1.8, ease: "easeInOut", repeat: Infinity },
          y: { duration: 1.8, ease: "easeInOut", repeat: Infinity },
          filter: { duration: 1.8, ease: "easeInOut", repeat: Infinity },
        }}
      />

      {/* Header sticky */}
      <div className="sticky top-0 z-40 border-b border-black/5 bg-white/70 backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight truncate">
                Perfil
              </h1>
              <p className="text-xs text-muted-foreground">
                Administra tu información y tu foto.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">
        <div className="rounded-[28px] border border-black/5 bg-white p-5 md:p-7">
          {/* Avatar + acciones */}
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Foto de perfil"
                    width={110}
                    height={110}
                    className="h-[110px] w-[110px] rounded-full object-cover border border-black/10"
                  />
                ) : (
                  <div className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-indigo-50 border border-indigo-100">
                    <span className="text-3xl font-semibold text-indigo-600">
                      {initials}
                    </span>
                  </div>
                )}

                {/* botón flotante */}
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-md active:scale-95 transition"
                  aria-label="Cambiar foto"
                >
                  <Camera className="h-5 w-5" />
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
                />
              </div>

              {/* Nombre + botones */}
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold leading-tight">
                  {fullName?.trim() || "Tu perfil"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground truncate">
                  {email || "Cuenta pública"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={openFilePicker}
                    className="rounded-full"
                  >
                    Cambiar foto
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={removeAvatar}
                    className="rounded-full"
                    disabled={!avatarPreview}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>

            {/* Tip */}
            <div className="rounded-2xl border border-black/5 bg-black/[0.02] px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-black/80">Tip</p>
              <p className="mt-0.5">
                Usa una foto clara, de frente y con buena iluminación.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre completo</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Mateo Hernández"
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={email}
                readOnly
                className="h-12 rounded-2xl bg-black/[0.02]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="33 1234 5678"
                inputMode="tel"
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de nacimiento</label>
              <Input
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                type="date"
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Género</label>

              {/* ✅ Select solo después de mount para evitar hydration mismatch */}
              {mounted ? (
                <Select
                  value={gender}
                  onValueChange={(v) => setGender(v as Gender)}
                >
                  <SelectTrigger className="h-12 rounded-2xl">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="MALE">Hombre</SelectItem>
                    <SelectItem value="FEMALE">Mujer</SelectItem>
                    <SelectItem value="NON_BINARY">No binario</SelectItem>
                    <SelectItem value="PREFER_NOT_TO_SAY">
                      Prefiero no decirlo
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-12 w-full rounded-2xl border border-black/10 bg-white" />
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-full"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="h-12 rounded-full px-8"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Guardando…
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}