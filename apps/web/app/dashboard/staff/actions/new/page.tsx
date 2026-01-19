"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStaffDraft } from "@/context/StaffDraftContext";
import { uploadImage, deleteImage } from "@/lib/services/uploads";

export default function CreateStaffPage() {
  const { state, dispatch } = useStaffDraft();
  const [isUploading, setIsUploading] = useState(false);

  async function handleAvatarChange(file?: File) {
    if (!file) return;

    try {
      setIsUploading(true);
      // 🔥 si ya había imagen previa, bórrala
      if (state.base.avatarPublicId) {
        await deleteImage(state.base.avatarPublicId);
      }

      // ⬆️ subir a cloudinary
      const res = await uploadImage(file, "staff");

      // 🧠 guardar en el draft
      dispatch({
        type: "SET_AVATAR",
        payload: {
          url: res.url,
          publicId: res.publicId,
        },
      });
    } catch (e) {
      console.error(e);
      alert("Error al subir imagen");
    } finally {
      setIsUploading(false);
    }
  }
  console.log("avatarUrl en draft:", state.base.avatarUrl);
  return (
    <div className="max-w-3xl mx-auto px-6 py-2 space-y-10">
      {/* HEADER */}
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">Perfil</h1>
        <p className="text-muted-foreground">
          Agrega a una persona que trabajará en tu negocio
        </p>
      </header>

      {/* CARD */}
      <div className=" rounded-2xl bg-white space-y-8">
        {/* ================= AVATAR ================= */}
        <div className="relative group">
          <Avatar className="h-44 w-44 overflow-hidden">
            <AvatarImage src={state.base.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-indigo-100 text-indigo-600">
              <User className="h-16 w-16" />
            </AvatarFallback>
          </Avatar>

          {/* OVERLAY */}
          <label
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-full w-44",
              isUploading
                ? "bg-black/60 cursor-not-allowed"
                : "bg-black/40 opacity-0 group-hover:opacity-100",
              "transition-opacity"
            )}
          >
            {isUploading ? (
              <div className="flex flex-col items-center text-white gap-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm font-medium">Subiendo imagen…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-white gap-1">
                <Camera className="h-6 w-6" />
                <span className="text-sm font-medium">Cambiar foto</span>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => handleAvatarChange(e.target.files?.[0])}
            />
          </label>
        </div>

        {/* ================= FORM ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre */}
          <div className="space-y-1">
            <Label>Nombre completo</Label>
            <Input
              placeholder="Ej. Juan Pérez"
              className="shadow-none py-6"
              value={state.base.name}
              onChange={(e) =>
                dispatch({
                  type: "SET_BASE",
                  payload: { name: e.target.value },
                })
              }
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="juan@email.com"
              className="shadow-none py-6"
              value={state.base.email}
              onChange={(e) =>
                dispatch({
                  type: "SET_BASE",
                  payload: { email: e.target.value },
                })
              }
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-1">
            <Label>Teléfono</Label>
            <Input
              placeholder="33 1234 5678"
              type="tel"
              className="shadow-none py-6"
              value={state.base.phone ?? ""}
              onChange={(e) =>
                dispatch({
                  type: "SET_BASE",
                  payload: { phone: e.target.value },
                })
              }
            />
          </div>

          {/* Rol de trabajo */}
          <div className="space-y-1">
            <Label>Rol de trabajo</Label>
            <Input
              placeholder="Ej. Barbero"
              className="shadow-none py-6"
              value={state.base.jobRole ?? ""}
              onChange={(e) =>
                dispatch({
                  type: "SET_BASE",
                  payload: { jobRole: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <Label>Permisos del staff</Label>
            <Select
              value={state.base.permissionRole}
              onValueChange={(value) =>
                dispatch({
                  type: "SET_BASE",
                  payload: { permissionRole: value as "staff" | "manager" },
                })
              }
            >
              <SelectTrigger className="py-6 shadow-none pr-8">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>

                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
