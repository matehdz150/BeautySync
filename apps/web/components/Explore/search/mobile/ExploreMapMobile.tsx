"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import * as L from "leaflet";
import { useEffect, useState } from "react";

export default function ExploreMapMobile({ branches }: any) {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  const [userLocation, setUserLocation] = useState<any>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {}
    );
  }, []);

  const center =
    userLocation ??
    (branches[0]
      ? [branches[0].lat, branches[0].lng]
      : [20.67, -103.35]);

  const icon = (rating: number) =>
    L.divIcon({
      className: "custom-rating-icon",
      html: `<div class="rating-marker">${rating.toFixed(1)}</div>`,
      iconSize: [56, 36],
      iconAnchor: [28, 42],
    });

  if (!key) return null;

  return (
    <MapContainer
      center={center as any}
      zoom={14}
      zoomControl={false}
      className="h-full w-full"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        url={`https://api.maptiler.com/maps/topo-v2/{z}/{x}/{y}.png?key=${key}`}
      />

      {branches.map((b: any) => {
        if (!b.lat || !b.lng) return null;

        return (
          <Marker
            key={b.id}
            position={[b.lat, b.lng]}
            icon={icon(b.ratingAvg ?? 0)}
          />
        );
      })}
    </MapContainer>
  );
}