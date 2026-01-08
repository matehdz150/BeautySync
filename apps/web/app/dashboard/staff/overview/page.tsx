"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownUp,
  ArrowUpDown,
  ChevronDown,
  Ellipsis,
  Filter,
  Search,
  SlidersVertical,
  Star,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { useBranch } from "@/context/BranchContext";
import { getStaffByBranch } from "@/lib/services/staff";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type StaffRow = {
  id: string;
  name: string;
  role: string;
  email: string | null;
  avatar: string | null;
  schedule: string;
  status: "pending" | "active" | "inactive";
  appointmentsToday: number;
  rating: number;
  totalClients: number;
};

export default function StaffSchedulesPage() {
  const { branch } = useBranch();

  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!branch) return;

    async function load() {
      const data = await getStaffByBranch(branch.id);

      console.log(data);

      const mapped: StaffRow[] = data.map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email ?? "—",
        schedule: s.schedule ?? "no definido",
        status: s.status ?? "active",
      }));

      setStaff(mapped);
    }

    load();
  }, [branch]);

  function shortEmail(email?: string, max = 22) {
    if (!email) return "—";
    return email.length > max ? email.slice(0, max) + "…" : email;
  }

  return (
    <div className="space-y-6 px-1">
      {/* TITLE */}
      <div>
        <h2 className="text-2xl font-semibold">Catalogo de staff</h2>
        <p className="text-sm text-muted-foreground">
          Encuentra a los miembros de tu staff facilmente
        </p>
      </div>

      {/* SEARCH */}
      <div className="relative flex items-center gap-5 w-full justify-between bg-gray-50 py-5 px-3">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre…"
          className="pl-11 shadow-none  w-100 bg-white rounded-2xl"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex gap-2">
          <Button variant={"outline"} className=" shadow-none px-4 rounded-2xl">
            Ordenar
            <ArrowUpDown />
          </Button>

          <Button variant={"outline"} className=" shadow-none px-4 rounded-2xl">
            Filtros
            <SlidersVertical />
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
        <div className="h-[60vh] flex flex-col min-h-0">
          {/* TABLE HEADER (NO SCROLL) */}
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[30%] " />
              <col className="w-[30%] " />
              <col className="w-[26%]" />
              <col className="w-[30%]" />
            </colgroup>

            <TableHeader>
              <TableRow>
                <TableHead className="px-5">Staff</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right pr-6"></TableHead>
              </TableRow>
            </TableHeader>
          </Table>

          {/* 👇 SCROLLABLE BODY */}
          <div className="overflow-y-auto flex-1 min-h-0">
            <Table className="table-fixed">
              <colgroup>
                <col className="w-[32%]" />
                <col className="w-[24%]" />
                <col className="w-[26%]" />
                <col className="w-[30%]" />
              </colgroup>

              <TableBody>
                {staff.map((s) => (
                  <TableRow
                    key={s.id}
                    className="hover:bg-indigo-50 cursor-pointer w-full"
                  >
                    <TableCell className="px-5 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-black text-lg text-white">
                              {s.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          {s.status === "active" && (
                            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border border-white" />
                          )}

                          {s.status === "pending" && (
                            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-indigo-400 border border-white" />
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-[15px] leading-tight">
                            {s.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.role ?? "Staff"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="font-medium">{s.rating ?? 5}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm">
                      {shortEmail(s.email)}
                    </TableCell>

                    <TableCell className="text-right ">
                      <Button variant={'outline'} className="rounded-2xl shadow-none">
                        Acciones
                        <ChevronDown/>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
