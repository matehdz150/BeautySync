"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { LocateFixed, Copy, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type GeocodeFeature = {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
};

const MapLabClient = dynamic(() => import("./_MapClient"), { ssr: false });

export default function MapLabPage() {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<GeocodeFeature[]>([]);
  const [loading, setLoading] = useState(false);

  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 20.6736,
    lng: -103.344, // GDL default
  });

  async function searchPlaces(value?: string) {
    const q = (value ?? query).trim();
    if (!q) return;

    setLoading(true);

    try {
      const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
      if (!key) throw new Error("Missing NEXT_PUBLIC_MAPTILER_KEY");

      // MapTiler Geocoding API (autocomplete)
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(
          q
        )}.json?key=${key}&limit=6&language=es`
      );

      const data = await res.json();

      const features: GeocodeFeature[] = (data.features ?? []).map((f: any) => ({
        id: f.id,
        place_name: f.place_name,
        center: f.center,
      }));

      setPlaces(features);
    } catch (e) {
      console.error(e);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }

  function pickPlace(p: GeocodeFeature) {
    const [lng, lat] = p.center;
    setCenter({ lat, lng });
    setQuery(p.place_name);
    setPlaces([]);
  }

  function copyCoords() {
    const text = `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
  }

  function useMyLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.log("No se pudo obtener ubicación:", err),
      { enableHighAccuracy: true }
    );
  }

  useEffect(() => {
    // Auto locate al cargar (si quieres)
    useMyLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-white">
      <div className="mx-auto w-full max-w-[1500px] px-6 md:px-10 py-10">
        <header className="space-y-2">
          <p className="text-xs tracking-[0.22em] uppercase text-muted-foreground">
            Map Lab
          </p>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Ubicación del negocio
          </h1>

          <p className="text-sm text-muted-foreground max-w-2xl">
            Busca una dirección, ajusta el pin y guarda coordenadas exactas.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
          {/* LEFT */}
          <section className="rounded-3xl border border-black/10 bg-white p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold">Buscar dirección</p>
              <p className="text-xs text-muted-foreground">
                Escribe una calle o lugar (ej: “Rubén Darío 1036 Guadalajara”)
              </p>
            </div>

            {/* Simple search */}
            <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-muted-foreground" />

                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") searchPlaces();
                  }}
                  placeholder="Escribe tu dirección…"
                  className="flex-1 bg-transparent outline-none text-sm"
                />

                <Button
                  onClick={() => searchPlaces()}
                  disabled={loading}
                  className="rounded-xl"
                >
                  {loading ? "..." : "Buscar"}
                </Button>
              </div>
            </div>

            {/* Results */}
            {places.length > 0 && (
              <div className="rounded-2xl border border-black/10 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-black/10 text-xs text-muted-foreground">
                  Resultados
                </div>

                <div className="divide-y divide-black/10">
                  {places.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => pickPlace(p)}
                      className="w-full text-left px-4 py-3 hover:bg-black/[0.03] transition"
                    >
                      <p className="text-sm font-medium line-clamp-2">
                        {p.place_name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.center[1].toFixed(5)}, {p.center[0].toFixed(5)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="rounded-2xl h-12 justify-between"
                onClick={useMyLocation}
              >
                Usar mi ubicación
                <LocateFixed className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                className="rounded-2xl h-12 justify-between"
                onClick={copyCoords}
              >
                Copiar coords
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            {/* Selected */}
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-xs text-muted-foreground">Coordenadas</p>

              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-medium">
                  {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
                </span>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Tip: click en el mapa o arrastra el pin para ajustar exacto.
              </p>
            </div>
          </section>

          {/* MAP */}
          <section className="rounded-3xl border border-black/10 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
              <p className="text-sm font-semibold">Mapa</p>
              <p className="text-xs text-muted-foreground">
                click · arrastra pin · zoom
              </p>
            </div>

            <div className="h-[560px]">
              <MapLabClient center={center} onChangeCenter={setCenter} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}