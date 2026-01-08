import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function pastelize(hex: string, amount = 0.85): string {
  if (!hex) return "#F3F4F6";

  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);

  return `rgb(${nr}, ${ng}, ${nb})`;
}

export function colorFromName(name: string) {
    const colors = [
      "#75a7ab", // pastel orange peach
      "#b1e8c4", // soft yellow
      "#e9f492", // mint green
      "#ffee83", // lilac violet
      "#ffda73", // soft sky blue
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }