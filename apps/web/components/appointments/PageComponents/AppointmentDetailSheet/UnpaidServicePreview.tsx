export function UnpaidServicePreview({
  name,
  color,
  staffName,
  minutes,
  start,
  priceCents,
}: any) {
  return (
    <div className="px-5 py-4">
      <p className="font-semibold mb-3 text-2xl mt-10">Servicios</p>

      <div className="flex items-center gap-3">
        <div
          className="w-1 h-20 rounded-full"
          style={{ backgroundColor: color ?? "#A78BFA" }}
        />

        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            {start?.toFormat("t")} • {minutes} min • {staffName}
          </p>
        </div>

        <p className="ml-auto font-medium">
          ${(priceCents / 100).toFixed(2)} MXN
        </p>
      </div>
    </div>
  );
}