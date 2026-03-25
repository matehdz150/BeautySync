"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

import { getStaffByBranch, Staff } from "@/lib/services/staff";
import { useTimeOffDraft, useTimeOffActions } from "@/context/TimeOffDraftContext";
import { cn } from "@/lib/utils";

type Props = {
  branchId: string;
};

export function StaffSelector({ branchId }: Props) {
  const { state } = useTimeOffDraft();
  const { setStaff } = useTimeOffActions();

  const [staff, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // 🔥 load staff
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await getStaffByBranch(branchId);
        if (mounted) setStaffList(data);
      } catch (e) {
        console.error("Error loading staff", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [branchId]);

  const selected = staff.find((s) => s.id === state.staffId);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Staff</p>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between shadow-none py-6 font-normal"
          >
            {selected ? (
              <div className="flex items-center gap-2">
                {selected.avatarUrl ? (
                  <img
                    src={selected.avatarUrl}
                    alt={selected.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                    {selected.name.charAt(0)}
                  </div>
                )}

                <span>{selected.name}</span>
              </div>
            ) : loading ? (
              "Cargando staff..."
            ) : (
              "Seleccionar staff"
            )}

            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-[--radix-popover-trigger-width] p-0"
        >
          <Command>
            <CommandGroup>
              {staff.map((s) => {
                const active = state.staffId === s.id;

                return (
                  <CommandItem
                    key={s.id}
                    onSelect={() => {
                      setStaff(s.id);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {s.avatarUrl ? (
                        <img
                          src={s.avatarUrl}
                          alt={s.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                          {s.name.charAt(0)}
                        </div>
                      )}

                      <span>{s.name}</span>
                    </div>

                    <Check
                      className={cn(
                        "w-4 h-4",
                        active ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}