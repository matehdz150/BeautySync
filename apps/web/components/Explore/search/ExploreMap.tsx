"use client";

import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
} from "react-leaflet";
import * as L from "leaflet";
import {
  useEffect,
  useState,
  useRef,
  useMemo,
  memo,
} from "react";
import { Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

// =============================
// 🔥 MARKERS MEMO (CLAVE)
// =============================
const MarkersLayer = memo(function MarkersLayer({
  branches,
  markersRef,
  createRatingIcon,
  setSelected,
}: any) {
  return (
    <>
      {branches.map((b: any) => {
        if (!b.lat || !b.lng) return null;

        return (
          <Marker
            key={b.id}
            position={[b.lat, b.lng]}
            icon={createRatingIcon(b.ratingAvg ?? 0)}
            ref={(ref) => {
              if (ref) markersRef.current[b.id] = ref;
              else delete markersRef.current[b.id];
            }}
            eventHandlers={{
              click: () => setSelected(b),
            }}
          />
        );
      })}
    </>
  );
});

// =============================
// 🔥 MAIN MAP
// =============================
export default function ExploreMap({
  branches,
  isFullMap,
  hoveredId,
}: any) {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  const [selected, setSelected] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<
    [number, number] | null
  >(null);

  const [initialCenter, setInitialCenter] = useState<
    [number, number] | null
  >(null);

  const markersRef = useRef<Record<string, L.Marker>>({});
  const setMarkerRef = useRef(
  (id: string) => (ref: L.Marker | null) => {
    if (ref) markersRef.current[id] = ref;
    else delete markersRef.current[id];
  }
);

  // =============================
  // 📍 GEO
  // =============================
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {},
    );
  }, []);

  // =============================
  // 🔥 CENTER FIJO
  // =============================
  useEffect(() => {
    if (initialCenter) return;

    if (userLocation) {
      setInitialCenter(userLocation);
    } else if (branches[0]?.lat && branches[0]?.lng) {
      setInitialCenter([branches[0].lat, branches[0].lng]);
    } else {
      setInitialCenter([20.67, -103.35]);
    }
  }, [userLocation, branches, initialCenter]);

  // =============================
  // 🔥 ICON MEMO
  // =============================
  const createRatingIcon = useMemo(() => {
    return (rating: number) =>
      L.divIcon({
        className: "custom-rating-icon",
        html: `<div class="rating-marker">${rating.toFixed(1)}</div>`,
        iconSize: [56, 36],
        iconAnchor: [28, 42],
      });
  }, []);

  // =============================
  // 🔥 HOVER → SOLO DOM (NO RENDER)
  // =============================
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      if (!el) return;

      const bubble = el.querySelector(".rating-marker");
      if (!bubble) return;

      if (id === hoveredId) {
        bubble.classList.add("active");
      } else {
        bubble.classList.remove("active");
      }
    });
  }, [hoveredId]);

  // =============================
  // 🔥 HELPERS
  // =============================
  function ResizeMap({ trigger }: { trigger: boolean }) {
    const map = useMap();

    useEffect(() => {
      const timeout = setTimeout(() => {
        map.invalidateSize();
      }, 300);

      return () => clearTimeout(timeout);
    }, [trigger, map]);

    return null;
  }

  function FlyToUser({ location }: any) {
    const map = useMap();

    useEffect(() => {
      if (!location) return;

      map.flyTo(location, 14, { duration: 0.8 });
    }, [location, map]);

    return null;
  }

  const userIcon = L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;background:#6366f1;border-radius:999px;
      box-shadow:0 0 0 6px rgba(99,102,241,0.2);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  if (!key) return <div>No map key</div>;
  if (!initialCenter) return null;

  return (
    <MapContainer
      key="map"
      center={initialCenter}
      zoom={14}
      zoomControl={false}
      className="h-full w-full rounded-md"
    >
      <ResizeMap trigger={isFullMap} />
      <FlyToUser location={userLocation} />

      <TileLayer
        url={`https://api.maptiler.com/maps/topo-v2/{z}/{x}/{y}.png?key=${key}`}
      />

      {userLocation && <Marker position={userLocation} icon={userIcon} />}

      <MarkersLayer
        branches={branches}
        markersRef={markersRef}
        createRatingIcon={createRatingIcon}
        setSelected={setSelected}
      />

      {selected && (
        <MarkerOverlay
          branch={selected}
          onClose={() => setSelected(null)}
          
        />
      )}
    </MapContainer>
  );
}

// =============================
// 🔥 OVERLAY
// =============================
function MarkerOverlay({ branch, onClose }: any) {
  const map = useMap();
  const router = useRouter();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function update() {
      const point = map.latLngToContainerPoint([
        branch.lat,
        branch.lng,
      ]);
      setPosition({ x: point.x, y: point.y });
    }

    update();
    map.on("move", update);
    map.on("zoom", update);

    return () => {
      map.off("move", update);
      map.off("zoom", update);
    };
  }, [map, branch]);

  return (
    <AnimatePresence>
      <motion.div
        key={branch.id}
        className="absolute z-[1000]"
        style={{
          left: position.x,
          top: position.y,
          translateX: "-50%",
          translateY: "-120%",
        }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.18 }}
      >
        <motion.div
          onClick={() => router.push(`/book/${branch.publicSlug}`)}
          className="w-64 bg-white rounded-xl shadow-xl border overflow-hidden cursor-pointer"
          whileHover={{ scale: 1.02 }}
        >
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="bg-white rounded-full p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {branch.coverImage && (
            <img
              src={branch.coverImage}
              className="w-full h-32 object-cover"
            />
          )}

          <div className="p-3">
            <h3 className="font-semibold text-sm">{branch.name}</h3>

            <p className="text-xs text-gray-500 line-clamp-1">
              {branch.address}
            </p>

            <div className="flex justify-between mt-2 text-xs">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {branch.ratingAvg.toFixed(1)}
              </span>
              <span className="text-indigo-500">
                {branch.servicesCount} servicios
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}