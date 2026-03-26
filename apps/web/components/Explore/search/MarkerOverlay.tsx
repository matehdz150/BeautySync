import { useMap } from "react-leaflet";

function MarkerOverlay({ branch, onClose }: any) {
  const map = useMap();

  const point = map.latLngToContainerPoint([
    branch.lat,
    branch.lng,
  ]);

  return (
    <div
      className="absolute z-[1000]"
      style={{
        left: point.x,
        top: point.y,
        transform: "translate(-50%, -120%)",
      }}
    >
      <div className="w-64 bg-white rounded-xl shadow-xl border overflow-hidden">
        {/* IMAGE */}
        {branch.coverImage && (
          <img
            src={branch.coverImage}
            className="w-full h-32 object-cover"
          />
        )}

        <div className="p-3">
          <h3 className="font-semibold text-sm">
            {branch.name}
          </h3>

          <p className="text-xs text-gray-500 line-clamp-1">
            {branch.address}
          </p>

          <div className="flex items-center justify-between mt-2 text-xs">
            <span>⭐ {branch.ratingAvg.toFixed(1)}</span>
            <span>{branch.servicesCount} servicios</span>
          </div>

          <button
            className="mt-3 w-full text-xs bg-black text-white py-2 rounded-lg"
          >
            Ver detalles
          </button>
        </div>
      </div>
    </div>
  );
}