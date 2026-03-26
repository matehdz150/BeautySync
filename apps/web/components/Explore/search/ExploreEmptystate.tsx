"use client";

import { SearchX, Sparkles } from "lucide-react";

export default function ExploreEmptyState() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-24 text-center">
      
      {/* ICON WRAPPER */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
          <SearchX className="w-10 h-10 text-indigo-500" />
        </div>

      </div>

      {/* TITLE */}
      <h2 className="text-2xl font-semibold text-black mb-2">
        No hay resultados para mostrar
      </h2>

      {/* SUBTITLE */}
      <p className="text-gray-500 text-base max-w-sm">
        Prueba ajustando los filtros o busca algo diferente ✨
      </p>
    </div>
  );
}