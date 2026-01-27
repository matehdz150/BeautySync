"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StaffAvatarGroup } from "./Table/StaffAvatarGroup";
import { CategoryBadgeIcon } from "./Table/CategoryBadgeIcon";
import { useRouter } from "next/navigation";
import type { Service } from "@/app/dashboard/services/overview/page";
import { Skeleton } from "../ui/skeleton";

export function ServicesTable({
  services,
  loading,
}: {
  services: Service[];
  loading: boolean;
}) {
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sampleRowRef = useRef<HTMLTableRowElement | null>(null);

  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [page, setPage] = useState(1);

  // ===== CALCULAR ROWS DINÁMICAMENTE =====
  useEffect(() => {
    function calc() {
      if (!containerRef.current || !sampleRowRef.current) return;

      const available = containerRef.current.clientHeight;
      const rowH = sampleRowRef.current.clientHeight;

      if (rowH > 0) {
        const safe = Math.max(3, Math.floor(available / rowH));
        setRowsPerPage(safe);
      }
    }

    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // ===== PAGINACIÓN =====
  const totalPages = Math.ceil(services.length / rowsPerPage);

  const current = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return services.slice(start, start + rowsPerPage);
  }, [services, page, rowsPerPage]);

  return (
    <div className="rounded-xl  bg-white overflow-hidden">
      <div
        className="max-h-[calc(95vh-220px)] flex flex-col"
        ref={containerRef}
      >
        <Table className="table-fixed">
          <colgroup>
            <col className="w-[32%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[16%]" />
            <col className="w-[15%]" />
          </colgroup>

          <TableHeader className="sticky top-0 bg-white z-10 border-b">
            <TableRow>
              <TableHead className="px-5 py-4">Servicio</TableHead>
              <TableHead className="py-4">Categoría</TableHead>
              <TableHead className="py-4">Duración</TableHead>
              <TableHead className="py-4">Precio</TableHead>
              <TableHead className="py-4">Staff</TableHead>
              <TableHead className="py-4 text-right pr-6" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* 🔥 SKELETON MODE */}
            {loading
              ? Array.from({ length: rowsPerPage }).map((_, i) => (
                  <TableRow key={i} ref={i === 0 ? sampleRowRef : undefined}>
                    <TableCell className="px-5 py-6.5">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>

                    <TableCell className="py-6.5">
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </TableCell>

                    <TableCell className="py-6.5">
                      <Skeleton className="h-4 w-10" />
                    </TableCell>

                    <TableCell className="py-6.5">
                      <Skeleton className="h-4 w-14" />
                    </TableCell>

                    <TableCell className="py-6.5">
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </TableCell>

                    <TableCell className="py-6.5 text-right pr-6">
                      <Skeleton className="h-6 w-6 ml-auto rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              : current.map((service, i) => (
                  <TableRow
                    key={service.id}
                    ref={i === 0 ? sampleRowRef : undefined}
                    className="hover:bg-indigo-100/40 cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/dashboard/services/serviceaction/edit/${service.id}`
                      )
                    }
                  >
                    <TableCell className="px-5 py-6.5 font-medium">
                      {service.name}
                    </TableCell>

                    <TableCell className="py-6.5">
                      <CategoryBadgeIcon
                        icon={service.categoryIcon}
                        color={service.categoryColor}
                        label={service.category}
                      />
                    </TableCell>

                    <TableCell className="py-6.5 text-muted-foreground">
                      {service.duration}
                    </TableCell>

                    <TableCell className="py-6.5 text-muted-foreground">
                      {service.price}
                    </TableCell>

                    <TableCell className="py-6.5">
                      <StaffAvatarGroup names={service.staff} />
                    </TableCell>

                    <TableCell className="py-6.5">
                      <Button variant="ghost" className="border shadow-none rounded-2xl text-sm font-medium hover:bg-indigo-300">
                        Acciones
                        <ChevronDown size={20}/>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>

          <TableFooter className="sticky bottom-0 bg-white z-10">
            <TableRow>
              <TableCell colSpan={6}>
                <div className="flex items-center justify-between px-2 py-2">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="shadow-none bg-black text-white"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="shadow-none bg-black text-white"
                      disabled={page === totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
