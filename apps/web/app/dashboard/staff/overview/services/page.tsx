"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const SERVICES = [
  "Corte de Cabello",
  "Barba",
  "Masaje Relajante",
  "Tinte",
  "Depilación",
  "Peinado",
];

const STAFF = [
  {
    id: "1",
    name: "Mateo",
    role: "Barbero",
    services: ["Corte de Cabello", "Barba", "Masaje Relajante"],
  },
  {
    id: "2",
    name: "Ana",
    role: "Estilista",
    services: ["Corte de Cabello", "Tinte"],
  },
  {
    id: "3",
    name: "Luis",
    role: "Masajista",
    services: ["Masaje Relajante"],
  },
];

export default function SpecialtiesByStaffPage() {
  const [query, setQuery] = useState("");
  const [staff, setStaff] = useState(STAFF);
  const [selected, setSelected] = useState("1");

  const filtered = staff.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  const selectedStaff = staff.find((s) => s.id === selected)!;

  function toggleService(service: string) {
    setStaff((prev) =>
      prev.map((s) =>
        s.id !== selected
          ? s
          : {
              ...s,
              services: s.services.includes(service)
                ? s.services.filter((srv) => srv !== service)
                : [...s.services, service],
            }
      )
    );
  }

  return (
    <div className="flex gap-6 px-2">

      {/* LEFT — STAFF LIST */}
      <div className="w-80 border rounded-xl bg-white p-4 flex flex-col space-y-3 h-[78vh]">

        <h3 className="font-semibold text-lg">Staff</h3>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="overflow-y-auto flex-1 space-y-2">
          {filtered.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`
                flex items-center gap-3 p-3 rounded-lg cursor-pointer
                transition
                ${
                  s.id === selected
                    ? "bg-indigo-100 border border-indigo-300"
                    : "hover:bg-gray-100"
                }
              `}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback>{s.name[0]}</AvatarFallback>
              </Avatar>

              <div>
                <p className="font-medium leading-tight">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — SERVICES */}
      <div className="flex-1 space-y-6">

        <h2 className="text-2xl font-semibold">
          Servicios asignados a {selectedStaff.name}
        </h2>

        <div className="border rounded-xl bg-white p-6 space-y-4">

          {SERVICES.map((service) => {
            const checked = selectedStaff.services.includes(service);

            return (
              <div
                key={service}
                className="flex items-center gap-3 py-2 border-b last:border-0"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleService(service)}
                />

                <p className="font-medium">{service}</p>
              </div>
            );
          })}
        </div>

        <Button className="rounded-xl w-fit">
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}