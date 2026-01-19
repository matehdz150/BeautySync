"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { StaffDraftProvider, useStaffDraft } from "@/context/StaffDraftContext";
import { useState } from "react";
import { useCreateStaff } from "@/hooks/useCreateStaff";
import { useStaffSubmit } from "@/hooks/useStafSubmit";
import { deleteImage } from "@/lib/services/uploads";
export default function NewServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const BASE = "/dashboard/staff/actions/new";

  const nav = [
    { label: "Información básica", href: `${BASE}` },
    { label: "Horario", href: `${BASE}/schedule` },
    { label: "Servicios", href: `${BASE}/services` },
  ];

  function isActive(href: string) {
    if (href === BASE) {
      return pathname === BASE || pathname.startsWith(`${BASE}/edit`);
    }
    return pathname.startsWith(href);
  }

  return (
    <StaffDraftProvider>
      {/* ⬇️ CONTENEDOR ROOT CON SCROLL */}
      <div className="h-screen overflow-y-auto">
        <div className="mx-auto px-8 py-8">
          {/* HEADER */}
          <header className="sticky top-0 z-40 bg-white py-6">
            <div className="flex items-center justify-between">
              <Title />
              <HeaderActions />
            </div>
          </header>

          {/* LAYOUT */}
          <div className="flex gap-5 mt-6">
            {/* SIDEBAR */}
            <aside className="w-64 shrink-0">
              <div className="bg-white rounded-2xl border p-4 sticky top-24">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Información
                </p>

                <div className="space-y-1">
                  {nav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block w-full px-3 py-2 rounded-md text-sm transition",
                        isActive(item.href)
                          ? "bg-indigo-400 text-white font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </div>
    </StaffDraftProvider>
  );
}

function HeaderActions() {
  const router = useRouter();
  const { submitCreate, submitUpdate } = useStaffSubmit();
  const { canSubmit, state } = useStaffDraft();
  const isEdit = !!state.createdStaffId;
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    try {
      setLoading(true);

      if (isEdit) {
        await submitUpdate();
      } else {
        await submitCreate();
      }

      router.push("/dashboard/staff");
    } catch (e) {
      console.error(e);
      alert("Error al guardar staff");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-3 mr-10">
      <Button
        variant="outline"
        onClick={async () => {
          if (state.base.avatarPublicId) {
            await deleteImage(state.base.avatarPublicId);
          }

          router.push("/dashboard/staff/overview");
        }}
      >
        Cerrar
      </Button>

      <Button disabled={!canSubmit || loading} onClick={handleSave}>
        {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear staff"}
      </Button>
    </div>
  );
}

function Title() {
  const { state } = useStaffDraft();
  const isEdit = !!state.createdStaffId;

  return (
    <h1 className="text-3xl font-bold">
      {isEdit ? "Editar staff" : "Agregar staff"}
    </h1>
  );
}
