"use client";

import {
  Search,
  SlidersHorizontal,
  MapPin,
  Navigation,
  Tag,
  ChevronDown,
  Scissors,
} from "lucide-react";
import { useState } from "react";
import ServicesFilter from "./ServicesFilter";
import FiltersButton from "./FiltersButton";
import GlobalSearchBar from "./GlobalSearchBar/GlobalSearchBar";

export function ExploreToolbar({
  total,
  onOpenFilters,
}: {
  total: number;
  onOpenFilters: () => void;
}) {
  const [query, setQuery] = useState("");
  const [locationLabel, setLocationLabel] = useState("Ubicación");
  const [openLocation, setOpenLocation] = useState(false);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Geolocalización no disponible");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        setLocationLabel("Mi ubicación");
        setOpenLocation(false);

        // 🔥 aquí luego guardas lat/lng global (context)
      },
      () => {
        alert("No se pudo obtener ubicación");
      },
    );
  }

  return (
    <div className="sticky top-0 z-30 bg-white px-6 py-4 space-y-3">
      {/* 🔥 MAIN BAR */}
      <div className="flex gap-3 ">
        {/* 🔍 SEARCH */}
        <GlobalSearchBar/>

        {/* 📍 LOCATION BUTTON */}
        <div className="relative">
          <button
            onClick={() => setOpenLocation((prev) => !prev)}
            className="flex items-center gap-2 border rounded-full px-4 py-2 text-sm hover:bg-gray-50 transition"
          >
            <MapPin className="w-4 h-4" />
            {locationLabel}
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* DROPDOWN */}
          {openLocation && (
            <div className="absolute mt-2 w-56 bg-white border rounded-xl shadow-lg z-50 p-2 space-y-1">
              <button
                onClick={useCurrentLocation}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-lg"
              >
                <Navigation className="w-4 h-4" />
                Usar mi ubicación
              </button>

              <button
                onClick={() => {
                  setLocationLabel("Guadalajara");
                  setOpenLocation(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg"
              >
                Guadalajara
              </button>

              <button
                onClick={() => {
                  setLocationLabel("CDMX");
                  setOpenLocation(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg"
              >
                Ciudad de México
              </button>
            </div>
          )}
        </div>

        {/* 🏷 CATEGORIES BUTTON */}
        <ServicesFilter/>
        {/* ⚙️ FILTERS */}
        <FiltersButton/>
      </div>

      {/* 🔥 RESULT COUNT */}
      <p className="text-sm text-gray-500">
        {total} establecimientos en el área indicada
      </p>
    </div>
  );
}
