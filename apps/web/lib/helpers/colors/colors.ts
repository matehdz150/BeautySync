export const tierColors = [
  {
    value: "FFD700",
    gradient: "from-yellow-300 via-yellow-400 to-yellow-500",
  },
  {
    value: "C0C0C0",
    gradient: "from-gray-300 via-gray-400 to-gray-500",
  },
  {
    value: "B9F2FF",
    gradient: "from-cyan-200 via-blue-200 to-indigo-300",
  },
  {
    value: "50C878",
    gradient: "from-green-400 via-emerald-500 to-green-600",
  },
  {
    value: "9966FF",
    gradient: "from-purple-400 via-fuchsia-500 to-indigo-500",
  },
  {
    value: "FF5A5F",
    gradient: "from-red-400 to-pink-500",
  },
  {
    value: "8B5CF6",
    gradient: "from-purple-500 to-indigo-500",
  },
];
export function getTierGradient(color?: string) {
  return (
    tierColors.find((c) => c.value === color)?.gradient ??
    "from-gray-200 to-gray-300"
  );
}

