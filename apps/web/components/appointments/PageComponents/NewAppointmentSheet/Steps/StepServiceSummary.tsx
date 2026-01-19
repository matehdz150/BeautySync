"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";

import { useEffect, useState } from "react";
import { useBranch } from "@/context/BranchContext";
import { getStaffForService } from "@/lib/services/staff";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { User, Clock } from "lucide-react";
import { DateTime } from "luxon";

import { useAppointmentBuilder } from "@/context/AppointmentBuilderContext";

type Staff = { id: string; name: string };

export function StepServiceSummary({
  onAddService,
  onContinue,
  onEditTimes,
}: {
  onAddService: () => void;
  onContinue: () => void;
  onEditTimes: (serviceId: string) => void;
}) {
  const { services, updateStaff } = useAppointmentBuilder();
  const { branch } = useBranch();

  const [staffMap, setStaffMap] = useState<Record<string, Staff[]>>({});

  // LOAD STAFF
  useEffect(() => {
    if (!branch) return;

    services.forEach(({ service }) => {
      getStaffForService(branch.id, service.id).then((res) => {
        setStaffMap((prev) => ({
          ...prev,
          [service.id]: res ?? [],
        }));
      });
    });
  }, [branch, services]);

  const total = services.reduce((sum, s) => sum + s.service.priceCents, 0);
  const missingStaff = services.some((s) => !s.staffId);

  return (
    <div className="flex flex-col">

      {/* 🔝 HEADER (NO SCROLL) */}
      <div className="px-6 pt-6 pb-3 bg-white">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Services</BreadcrumbPage>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>Summary</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* 🧾 LISTA CON ALTURA FIJA + SCROLL */}
      <div className="px-6 pb-4">
        <div className="space-y-6 max-h-135 min-h-135 overflow-y-auto pr-1">
          {services.map(({ service, staffId, startISO }) => (
            <div
              key={service.id}
              className="flex items-start justify-between gap-4"
            >
              <div
                className="border-l-4 pl-3"
                style={{
                  borderColor: service.category?.colorHex ?? "#e5e7eb",
                }}
              >
                <p className="font-medium">{service.name}</p>

                <p className="text-sm text-muted-foreground">
                  {service.durationMin} min
                </p>

                {/* STAFF SELECT */}
                <div className="mt-3">
                  <Select
                    value={staffId}
                    onValueChange={(staffId) => {
                      const staff = (staffMap[service.id] ?? []).find(
                        (s) => s.id === staffId
                      );
                      updateStaff(
                        service.id,
                        staffId,
                        staff?.name ?? "Any staff"
                      );
                    }}
                  >
                    <SelectTrigger className="w-56 pl-12 rounded-3xl shadow-none relative">
                      <span className="absolute left-3 bg-indigo-50 p-1 rounded-full">
                        <User className="h-4 w-4 text-indigo-400" />
                      </span>

                      <SelectValue placeholder="Any team member" />
                    </SelectTrigger>

                    <SelectContent>
                      {(staffMap[service.id] ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* TIME INFO */}
                <div className="mt-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />

                  {startISO ? (
                    <p className="text-sm">
                      {DateTime.fromISO(startISO)
                        .setZone("America/Mexico_City")
                        .toFormat("EEE d • h:mma")}
                    </p>
                  ) : (
                    <p className="text-sm text-orange-500">
                      No time selected yet
                    </p>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() => onEditTimes(service.id)}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              <p className="font-medium whitespace-nowrap">
                ${(service.priceCents / 100).toFixed(2)}
              </p>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={onAddService}
            className="rounded-3xl shadow-none"
          >
            + Add service
          </Button>
        </div>
      </div>

      {/* 🔚 FOOTER (NO SCROLL) */}
      <div className="border-t px-6 py-4 flex items-center justify-between bg-white">
        <div>
          <p className="text-xs text-muted-foreground">Total (Incl. tax)</p>
          <p className="font-semibold">${(total / 100).toFixed(2)}</p>
        </div>

        <Button className="w-48" onClick={onContinue} disabled={missingStaff}>
          Continue
        </Button>
      </div>
    </div>
  );
}