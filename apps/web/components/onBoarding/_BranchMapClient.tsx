"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import { Plus, Minus, LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function BranchMapClient({
  center,
  onChangeCenter,
}: {
  center: { lat: number; lng: number };
  onChangeCenter: (next: { lat: number; lng: number }) => void;
}) {
  const markerIcon = useMemo(() => {
    const svg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24">
        <path fill="#111827" d="M12 2c-3.866 0-7 3.134-7 7c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/>
      </svg>
    `);

    return new L.Icon({
      iconUrl: `data:image/svg+xml,${svg}`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });
  }, []);

  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  const [actions, setActions] = useState<{
    zoomIn: () => void;
    zoomOut: () => void;
    recenter: () => void;
  } | null>(null);

  if (!key) {
    return (
      <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
        Falta NEXT_PUBLIC_MAPTILER_KEY
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={66}
        scrollWheelZoom
        zoomControl={false} // ✅ QUITA LOS + -
        className="h-full w-full"
      >
        <FixInvalidateSize />

        <TileLayer
          attribution="&copy; MapTiler &copy; OpenStreetMap contributors"
          url={`https://api.maptiler.com/maps/topo-v2/{z}/{x}/{y}.png?key=${key}`}
        />

        <Recenter center={center} />
        <ClickHandler onPick={onChangeCenter} />

        <Marker
          position={[center.lat, center.lng]}
          draggable
          icon={markerIcon}
          eventHandlers={{
            dragend(e) {
              const m = e.target as any;
              const p = m.getLatLng();
              onChangeCenter({ lat: p.lat, lng: p.lng });
            },
          }}
        />

        {/* 👇 Exponemos acciones del mapa */}
        <MapActions onReady={setActions} />
      </MapContainer>

      {/* ✅ CONTROLES CUSTOM (encima del mapa) */}
      <div className="absolute left-4 top-4 z-[999] flex flex-col gap-2">
        <Button
          type="button"
          variant="primary"
          size="icon"
          className="rounded-2xl shadow-none"
          onClick={() => actions?.zoomIn()}
        >
          <Plus className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="primary"
          size="icon"
          className="rounded-2xl shadow-none"
          onClick={() => actions?.zoomOut()}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="primary"
          size="icon"
          className="rounded-2xl shadow-none"
          onClick={() => actions?.recenter()}
        >
          <LocateFixed className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ClickHandler({
  onPick,
}: {
  onPick: (next: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FixInvalidateSize() {
  const map = useMap();

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    });

    const t = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => clearTimeout(t);
  }, [map]);

  return null;
}

function Recenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([center.lat, center.lng], map.getZoom(), {
      animate: true,
      duration: 0.6,
    });
  }, [center.lat, center.lng, map]);

  return null;
}

function MapActions({
  onReady,
}: {
  onReady: (actions: {
    zoomIn: () => void;
    zoomOut: () => void;
    recenter: () => void;
  }) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onReady({
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
      recenter: () => {
        map.flyTo(map.getCenter(), Math.max(map.getZoom(), 16), {
          animate: true,
          duration: 0.5,
        });
      },
    });
  }, [map, onReady]);

  return null;
}