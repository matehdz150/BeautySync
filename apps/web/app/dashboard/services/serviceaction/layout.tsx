"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  ServiceDraftProvider,
  useServiceDraft,
} from "@/context/ServiceDraftContext";
import {
  assignServiceToStaff,
  createService,
  unassignServiceFromStaff,
  updateService,
} from "@/lib/services/services";
export default function NewServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const BASE = "/dashboard/services/serviceaction";

  const nav = [
    { label: "Información básica", href: `${BASE}` },
    { label: "Equipo asignado", href: `${BASE}/team` },
    { label: "Notas", href: `${BASE}/notes` },
    { label: "Reglas especiales", href: `${BASE}/rules` },
  ];

  function isActive(href: string) {
    if (href === BASE) {
      return pathname === BASE || pathname.startsWith(`${BASE}/edit`);
    }

    return pathname.startsWith(href);
  }

  return (
    <ServiceDraftProvider>
      <div className="min-h-screen">
        <div className="mx-auto px-8 py-8">
          {/* HEADER */}
          <header className="sticky top-0 z-40 bg-white py-6">
            <div className="flex items-center justify-between">
              <Title/>
              <HeaderActions />
            </div>
          </header>

          {/* LAYOUT */}
          <div className="flex gap-5 ">
            {/* SIDEBAR */}
            <aside className="w-64">
              <div className="bg-white rounded-2xl border p-4 sticky top-24 max-h-[calc(100vh-96px)] overflow-y-auto">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Información
                </p>

                <div className="space-y-1">
                  {nav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block w-full text-left px-3 py-2 rounded-md text-sm",
                        isActive(item.href)
                          ? "bg-indigo-500 text-white font-medium"
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
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </div>
    </ServiceDraftProvider>
  );
}

function HeaderActions() {
  const router = useRouter();
  const { state, dispatch, isValid, validateAndFocus } = useServiceDraft();

  async function handleSave() {
    try {
      const ok = validateAndFocus();
      if (!ok) return;

      let service;

      if (state.id) {
        // EDITANDO
        service = await updateService(state.id, state);
      } else {
        // CREANDO
        service = await createService(state);
      }

      // ============================
      // 🔥 SYNC STAFF ASSIGNMENTS
      // ============================

      const original = state.originalStaffIds ?? [];
      const current = state.staffIds ?? [];

      const toAdd = current.filter((id) => !original.includes(id));
      const toRemove = original.filter((id) => !current.includes(id));

      await Promise.all([
        ...toAdd.map((staffId) =>
          assignServiceToStaff({ staffId, serviceId: service.id })
        ),
        ...toRemove.map((staffId) =>
          unassignServiceFromStaff({ staffId, serviceId: service.id })
        ),
      ]);

      dispatch({ type: "RESET" });
      router.push("/dashboard/services");
    } catch (err) {
      console.error(err);
    }
  }

  function handleCancel() {
    dispatch({ type: "RESET" });
    router.push("/dashboard/services");
  }

  return (
    <div className="flex gap-3 mr-10">
      <Button
        variant="outline"
        className="bg-white shadow-none"
        onClick={handleCancel}
      >
        Cerrar
      </Button>

      <Button
        className={cn(
          "bg-black text-white hover:bg-black/90",
          !isValid && "opacity-50 cursor-not-allowed"
        )}
        onClick={handleSave}
      >
        Guardar
      </Button>
    </div>
  );
}

function Title() {
  const { state } = useServiceDraft();

  return (
    <h1 className="text-3xl font-bold">
      {state.id ? "Editar servicio" : "Nuevo servicio"}
    </h1>
  );
}