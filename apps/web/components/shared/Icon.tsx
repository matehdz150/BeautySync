"use client";

import * as Icons from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export function CategoryIcon({
  name,
  className = "w-3 h-3",
}: {
  name?: string;
  className?: string;
}) {
  if (!name) return null;

  // Normaliza casing → "blend" → "Blend"
  const normalized =
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  // 👇 convertimos el namespace en un diccionario de componentes React válidos
  const Icon =
    (Icons as unknown as Record<string, ComponentType<SVGProps<SVGSVGElement>>>)
      [normalized] ?? Icons.HelpCircle;

  return <Icon className={className} />;
}