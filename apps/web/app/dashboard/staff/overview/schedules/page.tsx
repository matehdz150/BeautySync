"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarSync, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = [
  "Lun","Mar","Mié","Jue","Vie","Sáb","Dom"
];

// MOCK STAFF + SCHEDULES
const STAFF = [
  {
    id: "1",
    name: "Mateo",
    role: "Barbero",
    schedule: ["10–6","10–6","10–6","10–6","10–6","11–3","—"]
  },
  {
    id: "2",
    name: "Ana",
    role: "Estilista",
    schedule: ["9–5","9–5","9–5","9–5","9–5","—","—"]
  },
  {
    id: "3",
    name: "Luis",
    role: "Tatuador",
    schedule: ["—","12–8","12–8","12–8","12–8","10–2","—"]
  },
  {
    id: "4",
    name: "Ana",
    role: "Estilista",
    schedule: ["9–5","9–5","9–5","9–5","9–5","—","—"]
  },
  {
    id: "5",
    name: "Luis",
    role: "Tatuador",
    schedule: ["—","12–8","12–8","12–8","12–8","10–2","—"]
  }
];

export default function SchedulesGrid() {

  return (
    <div className="space-y-6">

      <div className="flex flex-col">
        <h2 className="text-2xl font-semibold">
        Horarios del equipo
      </h2>
        <p className="text-sm text-muted-foreground">
            Visualiza el horario de cada miembro del equipo.
          </p>
      </div>
      

      <div className="flex w-full justify-between bg-gray-50 py-5 px-3">
        <Button variant={'outline'} className="shadow-none px-4 rounded-2xl">
        Editar horarios
        <ChevronDown/>
      </Button>
      <div className="flex">
        <Button variant={'outline'} className="rounded-l-2xl rounded-r-none shadow-none">
          <ChevronLeft/>
        </Button>
        <Button variant={'outline'} className="rounded-none border-x-0 shadow-none border-r">
          Esta semana
        </Button>
        <Button variant={'outline'} className="rounded-none border-x-0 shadow-none">
          1-7 Sep, 2025
        </Button>
        <Button variant={'outline'} className="rounded-r-2xl rounded-l-none shadow-none">
          <ChevronRight/>
        </Button>
      </div>
      </div>

      <Card className="p-0 overflow-hidden border-none rounded-none">

        {/* WRAPPER PARA SCROLL HORIZONTAL */}
        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead>
              <tr className="border-b">

                <th className="text-left p-4 w-60">
                  Staff
                </th>

                {DAYS.map(d => (
                  <th
                    key={d}
                    className="text-center text-sm font-medium p-3"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {STAFF.map(s => (
                <tr key={s.id} className="border hover:bg-indigo-50">

                  {/* STAFF INFO */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {s.name[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.role}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* SCHEDULE CELLS */}
                  {s.schedule.map((slot,i)=>(
                    <td
                      key={i}
                      className={cn(
                        "text-center text-sm p-3 border-l",
                        slot === "—" && "text-muted-foreground"
                      )}
                    >
                      <div className={cn(
                        "rounded-lg px-3 py-2 inline-block min-w-[84px]",
                        slot === "—"
                          ? "bg-gray-100 border-gray-200"
                          : "bg-indigo-400 border-indigo-200 text-white"
                      )}>
                        {slot}
                      </div>
                    </td>
                  ))}

                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </Card>
    </div>
  );
}