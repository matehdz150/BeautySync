"use client";

import { useEffect, useState } from "react";
import { ChevronsUpDown, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { useGiftCardDraft } from "@/context/GiftCardDraftContext";
import { useBranch } from "@/context/BranchContext";
import { getPublicClients, PublicClient } from "@/lib/services/clients";

export default function ClientSelect() {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<PublicClient[]>([]);
  const [loading, setLoading] = useState(true);

  const { branch } = useBranch();

  const {
    state,
    setPublicUser,
    clearPublicUser,
    setSendEmail,
    setEmail,
  } = useGiftCardDraft();

  const selected = clients.find(
    (c) => c.publicUserId === state.publicUserId
  );

  /* LOAD CLIENTS */
  useEffect(() => {
    if (!branch) return;

    async function loadClients() {
      try {
        setLoading(true);
        const data = await getPublicClients(branch.organizationId);
        setClients(data);
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, [branch]);

  return (
    <div className="space-y-3 mt-2">
      <Label>Asignar a cliente (opcional)</Label>

      {/* SELECT */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-14 justify-between rounded-md px-3 shadow-none"
          >
            {selected ? (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={selected.avatarUrl ?? ""} />
                  <AvatarFallback>
                    {selected.name?.[0] ?? "?"}
                  </AvatarFallback>
                </Avatar>

                <span className="text-sm">
                  {selected.name ?? "Sin nombre"}
                </span>

                <X
                  className="w-4 h-4 opacity-50 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearPublicUser();
                  }}
                />
              </div>
            ) : (
              <span className="text-muted-foreground">
                Seleccionar cliente…
              </span>
            )}

            <ChevronsUpDown className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[360px] p-0">
          <Command>
            <div className="p-3">
              <CommandInput placeholder="Buscar cliente..." />
            </div>

            <CommandList>
              {loading ? (
                <div className="p-4 text-sm">Cargando...</div>
              ) : (
                <CommandGroup>
                  {clients.map((c) => (
                    <CommandItem
                      key={c.id}
                      onSelect={() => {
                        if (!c.publicUserId) return;

                        setPublicUser(c.publicUserId);

                        // 🔥 autocompletar email
                        setEmail(c.email ?? "");
                        setSendEmail(!!c.email);

                        setOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={c.avatarUrl ?? ""} />
                          <AvatarFallback>
                            {c.name?.[0] ?? "?"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col text-sm">
                          <span>{c.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {c.email}
                          </span>
                        </div>
                      </div>

                      <Check
                        className={cn(
                          "h-4 w-4",
                          state.publicUserId === c.publicUserId
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* 🔥 EMAIL SECTION */}
      {selected && (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={state.sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            Enviar por correo
          </label>

          {state.sendEmail && (
            <Input
              placeholder="correo@ejemplo.com"
              value={state.email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </div>
      )}
    </div>
  );
}