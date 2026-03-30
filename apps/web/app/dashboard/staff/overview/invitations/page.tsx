"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, Plus, Search, SlidersVertical } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useBranch } from "@/context/BranchContext";
import {
  getStaffWithInvites,
  reinviteStaff,
  StaffWithInvite,
} from "@/lib/services/staff";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { EmptyStaffState } from "../EmptyStaffState";

export default function StaffInvitesPage() {
  const { branch } = useBranch();
  const router = useRouter();

  const [staff, setStaff] = useState<StaffWithInvite[]>([]);
  const [query, setQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!branch) return;

    async function load() {
      const data = await getStaffWithInvites(branch.id);
      setStaff(data);
    }

    load();
  }, [branch]);

  function shortEmail(email?: string | null, max = 22) {
    if (!email) return "—";
    return email.length > max ? email.slice(0, max) + "…" : email;
  }

  function goToEdit(id: string) {
    router.push(`/dashboard/staff/actions/edit/${id}`);
  }

  function getInviteBadge(invite: StaffWithInvite["invite"]) {
    if (!invite) {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
          Sin invitar
        </span>
      );
    }

    if (invite.status === "pending") {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-600">
          Invitación enviada
        </span>
      );
    }

    if (invite.status === "accepted") {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
          Invitacion aceptada
        </span>
      );
    }

    if (invite.status === "expired") {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600">
          Expirada
        </span>
      );
    }
  }

  async function handleReinvite(staffId: string) {
    try {
      setLoadingId(staffId);

      // 🔥 limpiar error previo
      setErrorById((prev) => {
        const copy = { ...prev };
        delete copy[staffId];
        return copy;
      });

      await reinviteStaff(staffId);

      // 🔥 update optimista
      setStaff((prev) =>
        prev.map((s) =>
          s.id === staffId
            ? {
                ...s,
                invite: {
                  status: "pending",
                  expiresAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                },
              }
            : s
        )
      );
    } catch (err: any) {
      console.error(err);

      let message =
        err?.message ||
        err?.response?.data?.message ||
        "No se pudo reenviar la invitación";

      // 🔥 traducción básica UX
      if (message.includes("active invite")) {
        message = "Ya existe una invitación activa";
      }

      if (message.includes("already accepted")) {
        message = "El usuario ya aceptó la invitación";
      }

      setErrorById((prev) => ({
        ...prev,
        [staffId]: message,
      }));
    } finally {
      setLoadingId(null);
    }
  }

  const filtered = staff.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 px-3 py-5">
      {/* TITLE */}
      <div>
        <h2 className="text-2xl font-semibold">Invitaciones de staff</h2>
        <p className="text-sm text-muted-foreground">
          Gestiona invitaciones y estado del staff
        </p>
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-5 w-full justify-between py-5 px-3 bg-gray-50">
        <div className="flex gap-2">
          <Button variant="outline" className="shadow-none px-4 rounded-2xl">
            Ordenar
            <ArrowUpDown />
          </Button>

          <Button variant="outline" className="shadow-none px-4 rounded-2xl">
            Filtros
            <SlidersVertical />
          </Button>
        </div>

        <div className="flex gap-2 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre…"
            className="pl-11 shadow-none w-100 bg-white rounded-2xl"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <Button
            onClick={() =>
              router.push("/dashboard/staff/actions/new")
            }
          >
            Agregar staff
            <Plus />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyStaffState />
      ) : (
        <div className="rounded-md bg-white overflow-hidden">
          <div className="h-[65vh] flex flex-col min-h-0">
            {/* HEADER */}
            <Table className="table-fixed">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[20%]" />
                <col className="w-[30%]" />
                <col className="w-[20%]" />
              </colgroup>

              <TableHeader>
                <TableRow>
                  <TableHead className="px-5">Staff</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right pr-6"></TableHead>
                </TableRow>
              </TableHeader>
            </Table>

            {/* BODY */}
            <div className="overflow-y-auto flex-1 min-h-0">
              <Table className="table-fixed">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[20%]" />
                  <col className="w-[30%]" />
                  <col className="w-[20%]" />
                </colgroup>

                <TableBody>
                  {filtered.map((s) => (
                    <TableRow
                      key={s.id}
                      className="hover:bg-indigo-50 cursor-pointer"
                      onClick={() => goToEdit(s.id)}
                    >
                      {/* STAFF */}
                      <TableCell className="px-5 py-5">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={s.avatarUrl ?? undefined} />
                            <AvatarFallback className="bg-black text-lg text-white">
                              {s.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <p className="font-semibold text-[15px]">
                              {s.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {s.jobRole ?? "Staff"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* STATUS */}
                      <TableCell>
                        {getInviteBadge(s.invite)}
                      </TableCell>

                      {/* EMAIL */}
                      <TableCell className="text-sm">
                        {shortEmail(s.email)}
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell
                        className="text-right space-y-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(!s.invite || s.invite.status === "expired" || s.invite.status === "pending") && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={loadingId === s.id}
                            onClick={() => handleReinvite(s.id)}
                          >
                            {loadingId === s.id ? "Enviando..." : "Reenviar"}
                          </Button>
                        )}

                        {/* 🔥 ERROR */}
                        {errorById[s.id] && (
                          <p className="text-xs text-red-500 mt-1">
                            {errorById[s.id]}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}