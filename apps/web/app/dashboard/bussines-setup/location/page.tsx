"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  MapPin,
  Save,
  ArrowLeft,
  Navigation,
  Search,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { updateBranchLocation } from "@/lib/services/branches";
import { useBranch } from "@/context/BranchContext";

const BranchLocationPickerMap = dynamic(
  () => import("./_BranchLocationPickerMap"),
  { ssr: false }
);

type LatLng = { lat: number; lng: number };

type Place = {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
};

const SEARCH_RADIUS_KM = 25;

export default function BranchLocationPage() {
  const router = useRouter();
  const { branch } = useBranch();

  const branchId = branch?.id;

  // =========================
  // STATE (branch coords as string)
  // =========================
  const [lat, setLat] = useState<string | null>(null);
  const [lng, setLng] = useState<string | null>(null);

  const [address, setAddress] = useState("");

  const [saving, setSaving] = useState(false);

  // =========================
  // SEARCH STATE
  // =========================
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  // =========================
  // INIT: load from branch
  // =========================
  useEffect(() => {
    if (!branch) return;

    setLat(branch.lat ?? null);
    setLng(branch.lng ?? null);
    setAddress(branch.address ?? "");

    setQuery("");
  }, [branch]);

  // =========================
  // PARSE to numbers for map
  // =========================
  const latNum = useMemo(() => {
    if (typeof lat !== "string") return null;
    const n = Number(lat);
    return Number.isFinite(n) ? n : null;
  }, [lat]);

  const lngNum = useMemo(() => {
    if (typeof lng !== "string") return null;
    const n = Number(lng);
    return Number.isFinite(n) ? n : null;
  }, [lng]);

  const hasCoords = latNum !== null && lngNum !== null;

  const center = useMemo<LatLng>(() => {
    return {
      lat: latNum ?? 20.6736,
      lng: lngNum ?? -103.344,
    };
  }, [latNum, lngNum]);

  // =========================
  // HELPERS
  // =========================
  function requestUserLocation(): Promise<LatLng> {
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

  function distanceKm(a: LatLng, b: LatLng) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;

    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;

    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) *
        Math.sin(dLng / 2) *
        Math.cos(lat1) *
        Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return R * c;
  }

  function pickPlace(p: Place) {
    const [placeLng, placeLat] = p.center;

    setLat(String(placeLat));
    setLng(String(placeLng));

    // opcional: guardamos address bonito
    setAddress(p.place_name);

    setResults([]);
  }

  // =========================
  // SEARCH (Geoapify + filter 25km from REAL user location)
  // =========================
  async function searchPlaces() {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setResults([]);

    try {
      const geoKey = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
      if (!geoKey) throw new Error("Missing NEXT_PUBLIC_GEOAPIFY_KEY");

      // 🔥 SIEMPRE pedimos ubicación real del usuario para buscar
      let loc = userLoc;

      if (!loc) {
        try {
          loc = await requestUserLocation();
          setUserLoc(loc);
          setLocationDenied(false);
        } catch (err) {
          console.error("❌ geolocation denied:", err);
          setLocationDenied(true);
          return;
        }
      }

      // Geoapify Autocomplete (bias hacia la ubicación del usuario)
      const url =
        `https://api.geoapify.com/v1/geocode/autocomplete?` +
        `text=${encodeURIComponent(q)}` +
        `&limit=10` +
        `&lang=es` +
        `&filter=countrycode:mx` +
        `&bias=proximity:${loc.lng},${loc.lat}` +
        `&apiKey=${geoKey}`;

      const res = await fetch(url);
      const data = await res.json();

      const mapped: Place[] = (data.features ?? []).map((f: any) => {
        const props = f.properties ?? {};
        const geom = f.geometry ?? {};
        const coords = geom.coordinates ?? []; // [lng, lat]

        const placeName =
          props.formatted ||
          props.address_line1 ||
          props.name ||
          "Ubicación";

        return {
          id: String(props.place_id ?? props.osm_id ?? Math.random()),
          place_name: placeName,
          center: [coords[0], coords[1]],
        };
      });

      // 🔥 filtro por radio (<= 25km)
      const filtered = mapped.filter((p) => {
        const [lng, lat] = p.center;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
        const d = distanceKm(loc!, { lat, lng });
        return d <= SEARCH_RADIUS_KM;
      });

      setResults(filtered);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // SAVE
  // =========================
  async function onSave() {
    if (!branchId) return;
    if (!hasCoords) return;

    setSaving(true);
    try {
      await updateBranchLocation(branchId, {
        lat: latNum!,
        lng: lngNum!,
        address: address.trim() ? address.trim() : undefined,
      });

      router.back();
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar la ubicación");
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // MY LOCATION
  // =========================
  async function useMyLocation() {
    setLocLoading(true);

    try {
      const loc = await requestUserLocation();
      setUserLoc(loc);
      setLocationDenied(false);

      setLat(String(loc.lat));
      setLng(String(loc.lng));

      if (!address.trim()) setAddress("Mi ubicación");
    } catch (err) {
      console.error(err);
      setLocationDenied(true);
      alert("No se pudo obtener tu ubicación");
    } finally {
      setLocLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 py-8">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-xs tracking-[0.22em] uppercase text-muted-foreground">
              Configuración
            </p>

            <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
              Ubicación del negocio
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {hasCoords
                ? "Tu ubicación ya está configurada. Puedes mover el pin si necesitas."
                : "Aún no tienes ubicación. Agrega un pin para que tus clientes puedan encontrarte."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-full gap-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>

            <Button
              type="button"
              className="rounded-full gap-2"
              onClick={onSave}
              disabled={!hasCoords || saving}
            >
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar ubicación"}
            </Button>
          </div>
        </div>

        <div className="h-6" />

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
          {/* LEFT PANEL */}
          <section className="rounded-3xl border bg-white p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full border flex items-center justify-center">
                <MapPin className="h-5 w-5 text-indigo-500" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {hasCoords ? "Ubicación actual" : "Agregar ubicación"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click en el mapa o busca un lugar cerca de ti.
                </p>
              </div>
            </div>

            {/* SEARCH */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Buscar lugar</p>

              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ej. Plaza Andares"
                  className="h-12 text-base shadow-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") searchPlaces();
                  }}
                />

                <Button
                  type="button"
                  onClick={searchPlaces}
                  disabled={loading}
                  className="h-12 rounded-xl px-4"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "..." : "Buscar"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Resultados limitados a ≈ {SEARCH_RADIUS_KM}km de tu ubicación
                real.
              </p>

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

              {results.length > 0 && (
                <div className="rounded-2xl border bg-white overflow-hidden">
                  <div className="max-h-[240px] overflow-auto">
                    {results.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => pickPlace(p)}
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
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COORDS */}
            <div className="rounded-2xl border bg-white px-4 py-3">
              <p className="text-xs text-muted-foreground">Coordenadas</p>

              {hasCoords ? (
                <p className="text-sm font-medium mt-1">
                  {latNum!.toFixed(6)}, {lngNum!.toFixed(6)}
                </p>
              ) : (
                <p className="text-sm font-medium mt-1 text-muted-foreground">
                  — sin ubicación —
                </p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Dirección (opcional)</p>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. Av. Patria 1200, Zapopan"
                className="h-12 text-base shadow-none"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-2xl gap-2"
              onClick={useMyLocation}
              disabled={locLoading}
            >
              <Navigation className="h-4 w-4" />
              {locLoading ? "Obteniendo ubicación..." : "Usar mi ubicación"}
            </Button>

            <div
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm",
                hasCoords
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-muted/40 text-muted-foreground"
              )}
            >
              {hasCoords ? (
                <span className="font-medium">Listo para guardar</span>
              ) : (
                <span className="font-medium">Pon el pin en el mapa</span>
              )}
            </div>

            <Button
              type="button"
              className="w-full h-12 rounded-2xl"
              onClick={onSave}
              disabled={!hasCoords || saving}
            >
              {saving ? "Guardando..." : "Guardar ubicación"}
            </Button>
          </section>

          {/* MAP */}
          <section className="rounded-3xl border bg-white overflow-hidden">
            <div className="relative h-[560px] w-full">
              <BranchLocationPickerMap
                center={center}
                onChange={(next) => {
                  setLat(String(next.lat));
                  setLng(String(next.lng));
                }}
              />

              <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
                <div className="rounded-2xl border bg-white/95 backdrop-blur px-4 py-2 shadow-sm">
                  <p className="text-sm font-semibold">
                    👇 Click en el mapa o arrastra el pin
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Luego presiona “Guardar ubicación”.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="h-10" />
      </div>
    </motion.div>
  );
}