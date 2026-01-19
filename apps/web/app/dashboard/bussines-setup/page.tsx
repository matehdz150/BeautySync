"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Store, MapPin, AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BranchDescriptionField } from "@/components/business-setup/BranchDescriptionField";
import { useBranch } from "@/context/BranchContext";

import { updateBranch, getBranchBasic } from "@/lib/services/branches";

export default function BranchSettingsPage() {
  const { branch } = useBranch();
  const branchId = branch?.id;

  // =========================
  // STATE
  // =========================
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // para no pisar cambios del usuario cuando llegue el fetch
  const didHydrate = useRef(false);

  // =========================
  // LOAD FROM API
  // =========================
  useEffect(() => {
    if (!branchId) return;

    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getBranchBasic(branchId);
        console.log(data)

        if (!alive) return;

        // evita re-hidratar si ya escribió algo
        if (!didHydrate.current) {
          setName(data.name ?? "");
          setAddress(data.address ?? "");
          setDescription(data.description ?? "");
          didHydrate.current = true;
        }
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError("No se pudo cargar la información de la sucursal.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [branchId]);

  // =========================
  // VALIDATION
  // =========================
  const canSave = useMemo(() => {
    if (!branchId) return false;
    if (saving) return false;
    if (loading) return false;
    return name.trim().length >= 2;
  }, [branchId, name, saving, loading]);

  // =========================
  // SAVE
  // =========================
  async function onSave() {
    if (!canSave) return;

    setSaving(true);
    setError(null);

    try {
      await updateBranch(branchId!, {
        name: name.trim(),
        address: address.trim() ? address.trim() : "",
        description: description.trim() ? description.trim() : "",
      });

      alert("Guardado 😎");
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar. Intenta otra vez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="w-full"
    >
      <div className="w-full px-8 py-10">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-6 relative">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-10 h-52 w-52 -translate-x-1/2 z-0 rounded-full blur-3xl
             bg-gradient-to-b from-indigo-400/75 via-indigo-400/10 to-transparent"
            initial={{ opacity: 0, scale: 0.92, filter: "blur(90px)" }}
            animate={{
              opacity: 1,
              scale: [1, 1.03, 1],
              y: [0, 10, 0],
              filter: ["blur(50px)", "blur(58px)", "blur(50px)"],
            }}
            transition={{
              opacity: { duration: 1.4, ease: "easeOut" },
              scale: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
              y: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
              filter: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
            }}
          />

          <div className="min-w-0 relative z-10">
            <p className="text-xs tracking-[0.22em] uppercase text-muted-foreground">
              Configuración
            </p>

            <h1 className="text-4xl font-bold tracking-tight">
              Configuración general
            </h1>

            <p className="mt-2 text-base text-muted-foreground">
              Ajusta la información principal de tu sucursal.
            </p>

            {loading && (
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando información...
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 relative z-10">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-11 px-5"
              onClick={() => history.back()}
            >
              Cerrar
            </Button>

            <Button
              type="button"
              className="rounded-xl h-11 px-5"
              onClick={onSave}
              disabled={!canSave}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>

        <div className="h-8" />

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* CONTENT */}
        <div className="relative bg-white overflow-hidden rounded-3xl border p-8">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Detalles del negocio
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Esta información se muestra a tus clientes.
                </p>
              </div>
            </div>

            <div className="h-8" />

            {/* GRID FORM */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Nombre */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Store className="h-4 w-4 text-indigo-500" />
                  Nombre de la sucursal
                </label>

                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Barbería Andares"
                  disabled={loading}
                  className={cn(
                    "h-14 rounded-xl text-base shadow-none",
                    "focus-visible:ring-indigo-400/30 focus-visible:border-indigo-400/40"
                  )}
                />
              </div>

              {/* Dirección */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-500" />
                  Dirección
                </label>

                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Av. Patria 1200, Zapopan"
                  disabled={loading}
                  className={cn(
                    "h-14 rounded-xl text-base shadow-none",
                    "focus-visible:ring-indigo-400/30 focus-visible:border-indigo-400/40"
                  )}
                />
              </div>
            </div>

            <div className="h-8" />

            {/* Descripción */}
            <div className="max-w-[980px]">
              <BranchDescriptionField
                value={description}
                onChange={setDescription}
                className={loading ? "opacity-60 pointer-events-none" : ""}
              />
            </div>

            <div className="h-10" />
          </div>
        </div>

        <div className="h-16" />
      </div>
    </motion.div>
  );
}