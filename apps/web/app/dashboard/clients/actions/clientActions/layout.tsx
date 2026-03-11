"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  ClientDraftProvider,
  useClientDraft,
} from "@/context/ClientDraftContext";

import { useState } from "react";

import { createClient, updateClient } from "@/lib/services/clients";

export default function ClientActionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();

  const clientId = params?.clientId as string | undefined;

  const BASE = clientId
    ? `/dashboard/clients/actions/clientActions/edit/${clientId}`
    : `/dashboard/clients/actions/clientActions/new`;

  const nav = [
    { label: "Información general", href: BASE },
    { label: "Información adicional", href: `${BASE}/additional` },
  ];

  function isActive(href: string) {
    if (href === BASE) {
      return pathname === BASE || pathname.startsWith(`${BASE}/edit`);
    }

    return pathname.startsWith(href);
  }

  return (
    <ClientDraftProvider>
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
                          : "text-gray-700 hover:bg-gray-50",
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
    </ClientDraftProvider>
  );
}

function hasChanges(state: any) {
  if (!state.original) return true;

  return (
    state.name !== state.original.name ||
    state.email !== state.original.email ||
    state.phone !== state.original.phone ||
    state.avatarUrl !== state.original.avatarUrl ||
    state.birthdate !== state.original.birthdate ||
    state.profile?.gender !== state.original.profile?.gender ||
    state.profile?.occupation !== state.original.profile?.occupation ||
    state.profile?.city !== state.original.profile?.city
  );
}

function HeaderActions() {
  const router = useRouter();
  const { state } = useClientDraft();

  const [loading, setLoading] = useState(false);

  const isEdit = !!state.id;

  const changed = hasChanges(state);

  const hasName = !!state.name && state.name.trim().length > 0;

  const canSubmit = isEdit ? hasName && changed : hasName;

  async function handleSave() {
    try {
      setLoading(true);

      if (isEdit && state.id) {
        console.log("STATE BEFORE UPDATE", state);

        const payload = {
          name: state.name ?? undefined,
          email: state.email?.trim() || undefined,
          phone: state.phone?.trim() || undefined,
          birthdate: state.birthdate ?? undefined,

          profile: {
            gender: state.profile?.gender ?? undefined,
            occupation: state.profile?.occupation ?? undefined,
            city: state.profile?.city ?? undefined,
          },
        };

        console.log("UPDATE PAYLOAD", payload);

        const response = await updateClient(state.id, payload);

        console.log("UPDATE RESPONSE", response);
      } else {
        const client = await createClient({
          name: state.name ?? "",
          email: state.email?.trim() || undefined,
          phone: state.phone?.trim() || undefined,
          birthdate: state.birthdate ?? undefined,

          profile: {
            gender: state.profile?.gender ?? undefined,
            occupation: state.profile?.occupation ?? undefined,
            city: state.profile?.city ?? undefined,
          },
        });

        router.push(
          `/dashboard/clients/actions/clientActions/edit/${client.id}`,
        );
      }

      router.push("/dashboard/clients");
    } catch (e) {
      console.error(e);
      alert("Error al guardar cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-3 mr-10">
      <Button
        variant="outline"
        onClick={() => router.push("/dashboard/clients")}
      >
        Cerrar
      </Button>

      <Button disabled={!canSubmit || loading} onClick={handleSave}>
        {loading
          ? "Guardando..."
          : isEdit
            ? "Guardar cambios"
            : "Crear cliente"}
      </Button>
    </div>
  );
}

function Title() {
  const { state } = useClientDraft();

  const isEdit = !!state.id;

  return (
    <h1 className="text-3xl font-bold">
      {isEdit ? "Editar cliente" : "Nuevo cliente"}
    </h1>
  );
}
