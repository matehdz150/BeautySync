"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import * as Icons from "lucide-react";

const AVAILABLE_ICONS = [
  "Balloon",
  "ShoppingBag",
  "Clover",
  "PartyPopper",
  "Crown",
  "Gem",
  "Gift",
  "Heart",
  "Trophy",
  "Award",
  "HandMetal",
  "Spade",
  "Club",
  "Star",
  "Flower2",
] as const;

export function IconPickerModal({
  open,
  onOpenChange,
  onSelect,
  color,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (icon: string) => void;
  color?: string; // 🔥 NEW
}) {
  const hex = color ? `#${color}` : "#999";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-10">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle>Selecciona un icono</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-5 gap-4 mt-6">
            {AVAILABLE_ICONS.map((name) => {
              const Icon = (Icons as any)[name] ?? Icons.Star;

              return (
                <button
                  key={name}
                  onClick={() => {
                    onSelect(name);
                    onOpenChange(false);

                  }}
                  className="w-14 h-14 flex items-center justify-center rounded-xl transition hover:scale-105"
                  style={{
                    borderColor: hex,
                  }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{
                      stroke: hex,
                      fill: `${hex}30`, 
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
