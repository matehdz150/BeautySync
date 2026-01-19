"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { Palette, Users, Scissors, User, DollarSign, Eclipse, CircleDollarSign } from "lucide-react";

/* ---------------------------------------------------- */
/* Reusable row trigger                                 */
/* ---------------------------------------------------- */
function SettingsRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 py-4 w-full">
      <div className="text-muted-foreground">{icon}</div>
      <span className="flex-1 text-sm font-medium">{label}</span>
    </div>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CalendarSettingsSheet({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        {/* HEADER */}
        <SheetTitle>
          <div className="px-6 py-5 border-b">
            <h2 className="text-xl font-semibold">Ajustes del calendario</h2>
            <p className="text-sm text-muted-foreground font-light">
              Personaliza cómo se visualiza tu agenda
            </p>
          </div>
        </SheetTitle>

        {/* BODY */}
        <div className="px-6 overflow-y-auto h-[calc(100vh-160px)]">
          <Accordion type="multiple" className="w-full divide-y">
            {/* 🎨 COLORES */}
            <AccordionItem value="colors" className="border-b">
              <AccordionTrigger className="px-0 hover:no-underline [&>svg]:text-muted-foreground">
                <SettingsRow
                  icon={<Eclipse className="w-7 h-7 text-black" strokeWidth={1.5} />}
                  label="Colores del calendario"
                />
              </AccordionTrigger>
              <AccordionContent className="pl-9 pb-4">
                <p className="text-sm text-muted-foreground">
                  Define cómo se colorean las citas, servicios o estados.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* 👥 MAX STAFF */}
            <AccordionItem value="max-staff" className="border-b">
              <AccordionTrigger className="px-0 hover:no-underline [&>svg]:text-muted-foreground">
                <SettingsRow
                  icon={<Users className="w-7 h-7 text-black" strokeWidth={1.5} />}
                  label="Máximo de staff visible"
                />
              </AccordionTrigger>
              <AccordionContent className="pl-9 pb-4">
                <div className="flex gap-2">
                  {[3, 5, 7, 10].map((n) => (
                    <button
                      key={n}
                      className="
                        rounded-full px-4 py-1.5 text-sm
                        border border-muted
                        hover:border-indigo-500
                        hover:text-indigo-600
                        transition
                      "
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ✂️ SERVICIO */}
            <AccordionItem value="service" className="border-b">
              <AccordionTrigger className="px-0 hover:no-underline [&>svg]:text-muted-foreground">
                <SettingsRow
                  icon={<Scissors className="w-7 h-7 text-black" strokeWidth={1.5}  />}
                  label="Mostrar solo servicio"
                />
              </AccordionTrigger>
              <AccordionContent className="pl-9 pb-4">
                <p className="text-sm text-muted-foreground">
                  Filtra el calendario para mostrar citas de un servicio
                  específico.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* 👤 CLIENTE */}
            <AccordionItem value="client" className="border-b">
              <AccordionTrigger className="px-0 hover:no-underline [&>svg]:text-muted-foreground">
                <SettingsRow
                  icon={<User className="w-7 h-7 text-black" strokeWidth={1.5} />}
                  label="Mostrar solo cliente"
                />
              </AccordionTrigger>
              <AccordionContent className="pl-9 pb-4">
                <p className="text-sm text-muted-foreground">
                  Muestra únicamente las citas de un cliente seleccionado.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* 💲 PRECIO */}
            <AccordionItem value="price" className="border-b">
              <AccordionTrigger className="px-0 hover:no-underline [&>svg]:text-muted-foreground">
                <SettingsRow
                  icon={<CircleDollarSign className="w-7 h-7 text-black" strokeWidth={1.5} />}
                  label="Rango de precio"
                />
              </AccordionTrigger>
              <AccordionContent className="pl-9 pb-4">
                <p className="text-sm text-muted-foreground">
                  Define un rango de precios para filtrar las citas visibles.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* FOOTER */}
        <div className="border-t px-6 py-10 flex gap-3">
          <Button variant="outline" className="flex-1 py-6">
            Limpiar filtros
          </Button>
          <Button className="flex-1 py-6">Aplicar</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
