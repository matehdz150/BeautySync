"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useMemo } from "react";

type Props = {
  center: { lat: number; lng: number };
  onChange: (next: { lat: number; lng: number }) => void;
};

export default function BranchLocationPickerMap({ center, onChange }: Props) {
  const markerIcon = useMemo(() => {
    const svg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24">
        <path fill="#4f46e5" d="M12 2c-3.866 0-7 3.134-7 7c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/>
      </svg>
    `);

    return new L.Icon({
      iconUrl: `data:image/svg+xml,${svg}`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });
  }, []);

  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  if (!key) {
    return (
      <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
        Falta NEXT_PUBLIC_MAPTILER_KEY
      </div>
    );
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={16}
      scrollWheelZoom
      zoomControl={false} // ✅ QUITAMOS +/-
      className="h-full w-full"
    >
      <TileLayer
        attribution="&copy; MapTiler &copy; OpenStreetMap contributors"
        url={`https://api.maptiler.com/maps/topo-v2/{z}/{x}/{y}.png?key=${key}`}
      />

      {/* ✅ AUTO-CENTER cuando cambie el center */}
      <RecenterMap center={center} />

      {/* click para mover pin */}
      <ClickHandler onPick={onChange} />

      <Marker
        position={[center.lat, center.lng]}
        draggable
        icon={markerIcon}
        eventHandlers={{
          dragend(e) {
            const m = e.target as any;
            const p = m.getLatLng();
            onChange({ lat: p.lat, lng: p.lng });
          },
        }}
      />
    </MapContainer>
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

/**
 * 🔥 Esto es lo que te faltaba:
 * Leaflet NO se recenter solo aunque cambie el prop `center`.
 */
function RecenterMap({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), {
      animate: true,
    });
  }, [center.lat, center.lng, map]);

  return null;
}