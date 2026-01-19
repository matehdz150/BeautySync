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

const pageMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

const headerMotion = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

const cardMotion = {
  initial: { opacity: 0, y: 14, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const staggerWrap = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const fieldMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

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
    <motion.div
      {...pageMotion}
      className="relative min-h-screen bg-white rounded-2xl"
    >
      {/* Header sticky */}
      <motion.div
        {...headerMotion}
        className="sticky top-0 z-40 border-b bg-transparent backdrop-blur-sm"
      >
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </motion.div>

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
      </motion.div>

      {/* Content */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">
        <motion.div
          {...cardMotion}
          className="rounded-[28px] border border-black/5 bg-white p-5 md:p-7"
        >
          {/* Avatar + acciones */}
          <motion.div
            variants={staggerWrap}
            initial="initial"
            animate="animate"
            className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
          >
            <motion.div variants={fieldMotion} className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <motion.div
                  key={avatarPreview ? "avatar-img" : "avatar-initials"}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
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
                </motion.div>

                {/* botón flotante */}
                <motion.button
                  type="button"
                  onClick={openFilePicker}
                  className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-md"
                  aria-label="Cambiar foto"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Camera className="h-5 w-5" />
                </motion.button>

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

                <motion.div
                  variants={fieldMotion}
                  className="mt-3 flex flex-wrap gap-2"
                >
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      onClick={openFilePicker}
                      className="rounded-full"
                    >
                      Cambiar foto
                    </Button>
                  </motion.div>

                  <motion.div whileTap={{ scale: 0.98 }}>
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
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            {/* Tip */}
            <motion.div
              variants={fieldMotion}
              className="rounded-2xl border border-black/5 bg-black/[0.02] px-4 py-3 text-sm text-muted-foreground"
            >
              <p className="font-medium text-black/80">Tip</p>
              <p className="mt-0.5">
                Usa una foto clara, de frente y con buena iluminación.
              </p>
            </motion.div>
          </motion.div>

          {/* Form */}
          <motion.div
            variants={staggerWrap}
            initial="initial"
            animate="animate"
            className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            <motion.div variants={fieldMotion} className="space-y-2">
              <label className="text-sm font-medium">Nombre completo</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Mateo Hernández"
                className="h-12 rounded-2xl"
              />
            </motion.div>

            <motion.div variants={fieldMotion} className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={email}
                readOnly
                className="h-12 rounded-2xl bg-black/[0.02]"
              />
            </motion.div>

            <motion.div variants={fieldMotion} className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="33 1234 5678"
                inputMode="tel"
                className="h-12 rounded-2xl"
              />
            </motion.div>

            <motion.div variants={fieldMotion} className="space-y-2">
              <label className="text-sm font-medium">Fecha de nacimiento</label>
              <Input
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                type="date"
                className="h-12 rounded-2xl"
              />
            </motion.div>

            <motion.div variants={fieldMotion} className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Género</label>

              {/* ✅ Select solo después de mount para evitar hydration mismatch */}
              {mounted ? (
                <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
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
            </motion.div>
          </motion.div>

          {/* CTA */}
          <motion.div
            variants={staggerWrap}
            initial="initial"
            animate="animate"
            className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-end"
          >
            <motion.div variants={fieldMotion} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-full"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </motion.div>

            <motion.div variants={fieldMotion} whileTap={{ scale: 0.98 }}>
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
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}