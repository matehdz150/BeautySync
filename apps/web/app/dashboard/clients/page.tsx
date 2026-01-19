"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  Plus,
  Search,
  SlidersVertical,
  Star,
} from "lucide-react";

import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/context/AuthContext";
import { getClients } from "@/lib/services/clients";
import { EmptyClientsState } from "./EmptyClientState";

/* =====================
   TYPES
===================== */

export type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  status: "active" | "inactive";
  totalAppointments?: number;
  rating?: number;
};

/* =====================
   PAGE
===================== */

export default function ClientsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user?.orgId) return;

    async function load() {
      const data = await getClients(user?.orgId);

      const mapped: ClientRow[] = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email ?? "—",
        avatar: c.avatarUrl ?? null,
        status: c.isActive ? "active" : "inactive",
        rating: c.rating ?? 5,
        totalAppointments: c.totalAppointments ?? 0,
      }));

      setClients(mapped);
    }

    load();
  }, [user]);

  function shortEmail(email?: string, max = 22) {
    if (!email) return "—";
    return email.length > max ? email.slice(0, max) + "…" : email;
  }

  function goToEdit(id: string) {
    router.push(`/dashboard/clients/actions/edit/${id}`);
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 px-3 py-5">
      {/* TITLE */}
      <div>
        <h2 className="text-2xl font-semibold">Catálogo de clientes</h2>
        <p className="text-sm text-muted-foreground">
          Administra y consulta tus clientes
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
            className="pl-11 shadow-none bg-white rounded-2xl"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <Button
            onClick={() =>
              router.push("/dashboard/clients/actions/new")
            }
          >
            Agregar cliente
            <Plus />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyClientsState />
      ) : (
        <div className="rounded-md bg-white overflow-hidden">
          <div className="h-[65vh] flex flex-col min-h-0">
            {/* TABLE HEADER */}
            <Table className="table-fixed">
              <colgroup>
                <col className="w-[35%]" />
                <col className="w-[20%]" />
                <col className="w-[30%]" />
                <col className="w-[15%]" />
              </colgroup>

              <TableHeader>
                <TableRow>
                  <TableHead className="px-5">Cliente</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right pr-6"></TableHead>
                </TableRow>
              </TableHeader>
            </Table>

            {/* BODY */}
            <div className="overflow-y-auto flex-1 min-h-0">
              <Table className="table-fixed">
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="hover:bg-indigo-50 cursor-pointer"
                      onClick={() => goToEdit(c.id)}
                    >
                      {/* CLIENT */}
                      <TableCell className="px-5 py-5">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={c.avatar ?? undefined} />
                            <AvatarFallback className="bg-black text-white">
                              {c.name.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <p className="font-semibold text-[15px] leading-tight">
                              {c.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {c.totalAppointments} citas
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* RATING */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="font-medium">{c.rating}</span>
                        </div>
                      </TableCell>

                      {/* EMAIL */}
                      <TableCell className="text-sm">
                        {shortEmail(c.email)}
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          className="rounded-2xl shadow-none"
                        >
                          Acciones
                          <ChevronDown />
                        </Button>
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