"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { motion } from "framer-motion";

export function ColorPickerModal({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (color: string) => void;
}) {
  const colors = [
    // básicos
    { id: "red", value: "FF5A5F", gradient: "from-red-400 to-pink-500" },
    {
      id: "purple",
      value: "8B5CF6",
      gradient: "from-purple-500 to-indigo-500",
    },

    // 🥇 GOLD
    {
      id: "gold",
      value: "FFD700",
      gradient: "from-yellow-300 via-yellow-400 to-yellow-500",
    },

    // 🥈 SILVER
    {
      id: "silver",
      value: "C0C0C0",
      gradient: "from-gray-300 via-gray-400 to-gray-500",
    },

    // 💎 DIAMOND
    {
      id: "diamond",
      value: "B9F2FF",
      gradient: "from-cyan-200 via-blue-200 to-indigo-300",
    },

    // 💚 EMERALD
    {
      id: "emerald",
      value: "50C878",
      gradient: "from-green-400 via-emerald-500 to-green-600",
    },

    // 🔮 PURPLE DIAMOND
    {
      id: "amethyst",
      value: "9966FF",
      gradient: "from-purple-400 via-fuchsia-500 to-indigo-500",
    },

    // 🔥 PLATINUM (pro)
    {
      id: "platinum",
      value: "E5E4E2",
      gradient: "from-gray-200 via-gray-300 to-gray-400",
    },

    // 🧊 ICE
    {
      id: "ice",
      value: "A5F3FC",
      gradient: "from-cyan-100 via-blue-100 to-indigo-200",
    },

    // 🌈 VIP
    {
      id: "vip",
      value: "FF00FF",
      gradient: "from-pink-500 via-purple-500 to-indigo-500",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-10 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="p-8"
        >
          <DialogHeader>
            <DialogTitle>Selecciona un color</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-5 gap-4 mt-6">
            {colors.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onSelect(c.value); // 🔥 guardas el HEX
                  onOpenChange(false);
                }}
                className={`w-14 h-14 rounded-full border transition hover:scale-110 bg-gradient-to-br ${c.gradient}`}
              />
            ))}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
