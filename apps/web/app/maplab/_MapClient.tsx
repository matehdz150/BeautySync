"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useMemo } from "react";

export default function MapLabClient({
  center,
  onChangeCenter,
}: {
  center: { lat: number; lng: number };
  onChangeCenter: (next: { lat: number; lng: number }) => void;
}) {
  const markerIcon = useMemo(() => {
    return new L.Icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
  }, []);

  function ClickHandler() {
    useMapEvents({
      click(e) {
        onChangeCenter({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  }

  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={16}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors &copy; MapTiler"
        url={`https://api.maptiler.com/maps/topo-v2/{z}/{x}/{y}.png?key=${key}`}
      />

      <ClickHandler />

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
    </MapContainer>
  );
}
