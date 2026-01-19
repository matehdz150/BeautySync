"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  Navigation,
  Search,
  MapPin,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Place = {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
};

const MapClient = dynamic(() => import("./_BranchMapClient"), { ssr: false });

const SEARCH_RADIUS_KM = 25;
const SEARCH_RADIUS_METERS = SEARCH_RADIUS_KM * 1000;

export function StepSetLocation({
  branchName,
  branchAddress,
  setBranchAddress,
  branchLat,
  setBranchLat,
  branchLng,
  setBranchLng,
}: {
  branchName: string;

  branchAddress: string;
  setBranchAddress: (v: string) => void;

  branchLat: number | null;
  setBranchLat: (v: number | null) => void;

  branchLng: number | null;
  setBranchLng: (v: number | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locationDenied, setLocationDenied] = useState(false);

  const hasCoords =
    typeof branchLat === "number" && typeof branchLng === "number";

  const center = useMemo(() => {
    if (hasCoords) return { lat: branchLat!, lng: branchLng! };
    if (userLoc) return userLoc;
    return { lat: 20.6736, lng: -103.344 }; // default GDL
  }, [hasCoords, branchLat, branchLng, userLoc]);

  function setCoords(next: { lat: number; lng: number }) {
    setBranchLat(next.lat);
    setBranchLng(next.lng);
  }

  function pick(p: Place) {
    const [lng, lat] = p.center;

    setQuery(p.place_name);
    setBranchAddress(p.place_name);

    setCoords({ lat, lng });
    setResults([]);
  }

  function requestUserLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Tu navegador no soporta geolocalización"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }

  async function search() {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setResults([]);

    try {
      const key = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
      if (!key) throw new Error("Missing NEXT_PUBLIC_GEOAPIFY_KEY");

      // 🔥 Necesitamos ubicación real para limitar 25km
      let loc = userLoc;

      if (!loc) {
        try {
          loc = await requestUserLocation();
          setUserLoc(loc);
          setLocationDenied(false);
        } catch (err) {
          console.error("❌ geolocation denied:", err);
          setLocationDenied(true);
          setResults([]);
          return;
        }
      }

      // Geoapify Autocomplete:
      // - bias: mejora ranking cerca de ti
      // - filter circle: limita resultados dentro de 25km
      const url =
        `https://api.geoapify.com/v1/geocode/autocomplete?` +
        `text=${encodeURIComponent(q)}` +
        `&lang=es` +
        `&limit=8` +
        `&bias=proximity:${loc.lng},${loc.lat}` +
        `&filter=circle:${loc.lng},${loc.lat},${SEARCH_RADIUS_METERS}` +
        `&format=json` +
        `&apiKey=${key}`;

      const res = await fetch(url);
      const data = await res.json();

      const mapped: Place[] = (data.results ?? []).map((r: any) => ({
        id: r.place_id || r.datasource?.raw?.osm_id || crypto.randomUUID(),
        place_name: r.formatted || r.address_line1 || r.name || "Sin nombre",
        center: [r.lon, r.lat],
      }));

      setResults(mapped);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function useMyLocation() {
    try {
      const loc = await requestUserLocation();
      setUserLoc(loc);
      setLocationDenied(false);

      setCoords(loc);

      if (!query.trim()) setQuery("Mi ubicación");
      if (!branchAddress.trim()) setBranchAddress("Mi ubicación");
    } catch (err) {
      console.error(err);
      setLocationDenied(true);
      alert("No se pudo obtener tu ubicación");
    }
  }

  return (
    <motion.div
      key="step-set-location"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      <div className="mx-auto w-full max-w-[1600px] px-6 md:px-10">
        <div className="pt-8 grid grid-cols-1 lg:grid-cols-[520px_1fr] gap-6 items-start">
          {/* LEFT */}
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs tracking-[0.22em] uppercase text-muted-foreground">
                Ubicación de la sucursal
              </p>

              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                ¿Dónde está{" "}
                <span className="text-indigo-400">
                  {branchName || "tu sucursal"}
                </span>
                ?
              </h2>

              <p className="text-sm text-muted-foreground">
                Solo pon el pin cerca. Luego lo puedes ajustar.
              </p>

              <div className="flex flex-wrap gap-2">
                <MiniStep icon={<Search className="h-4 w-4" />} label="Busca" />
                <MiniStep
                  icon={<MapPin className="h-4 w-4" />}
                  label="Click en mapa"
                />
                <MiniStep
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Listo"
                  active={hasCoords}
                />
              </div>

              {locationDenied && (
                <div className="rounded-2xl border bg-white px-4 py-3 text-sm flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-medium">Activa tu ubicación</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Para buscar cerca necesitamos permisos de ubicación.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <section className="rounded-3xl border bg-white p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Buscar dirección</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Resultados limitados a ≈ {SEARCH_RADIUS_KM}km de tu ubicación
                    real.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={useMyLocation}
                  className="rounded-full h-10 px-4 gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  Mi ubicación
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ej. Plaza Andares"
                  className="h-12 text-base shadow-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") search();
                  }}
                />

                <Button
                  type="button"
                  onClick={search}
                  disabled={loading}
                  className="h-12 rounded-xl px-4"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Buscando..." : "Buscar"}
                </Button>
              </div>

              <div
                className={cn(
                  "rounded-2xl border bg-white overflow-hidden transition",
                  results.length > 0 ? "opacity-100" : "opacity-60"
                )}
              >
                <div className="max-h-[260px] overflow-auto">
                  {results.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-muted-foreground">
                      Busca una dirección o pon el pin directo en el mapa.
                    </div>
                  ) : (
                    results.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => pick(p)}
                        className="w-full text-left px-4 py-3 hover:bg-black/[0.03] flex gap-3"
                      >
                        <div className="h-9 w-9 rounded-xl border flex items-center justify-center shrink-0">
                          <MapPin className="h-4 w-4 text-indigo-500" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {p.place_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.center[1].toFixed(5)}, {p.center[0].toFixed(5)}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border bg-white px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pin actual</p>
                  <p className="text-sm font-medium">
                    {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
                  </p>
                </div>

                {hasCoords ? (
                  <div className="inline-flex items-center gap-2 text-xs text-green-700 font-medium">
                    <Sparkles className="h-4 w-4" />
                    Perfecto
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground font-medium">
                    Pon el pin 👇
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT MAP */}
          <section className="rounded-3xl border bg-white overflow-hidden flex flex-col">
            <div className="relative w-full h-110 md:h-150 lg:h-170">
              <MapClient center={center} onChangeCenter={setCoords} />

              {!hasCoords ? (
                <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
                  <div className="rounded-2xl border bg-white/95 backdrop-blur px-4 py-2 shadow-sm">
                    <p className="text-sm font-semibold">
                      👇 Click en el mapa para poner el pin
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Luego puedes arrastrarlo para afinar.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
                  <div className="rounded-2xl border bg-white/95 backdrop-blur px-4 py-2 shadow-sm">
                    <p className="text-sm font-semibold">
                      ✅ Listo. Arrastra el pin si quieres dejarlo exacto.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="h-8" />
      </div>
    </motion.div>
  );
}

function MiniStep({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        active ? "border-green-500/30 text-green-700" : "text-muted-foreground"
      )}
    >
      <span className={cn(active ? "text-green-700" : "text-muted-foreground")}>
        {icon}
      </span>
      {label}
    </div>
  );
}