export function CouponCard({
  title = "CUPON DE DSCUENTO",
  discount = "30%",
  subtitle = "VOUCHER",
  branchName = "Belza",
  code = "WELCOME20",
}: {
  title?: string;
  discount: string;
  subtitle?: string;
  branchName?: string;
  code?: string;
}) {
  return (
    <div className="flex w-[420px] h-[160px] rounded-2xl overflow-hidden shadow-xl">
      
      {/* LEFT */}
      <div className="relative flex-1 bg-[#f5f5f4] p-6 flex flex-col justify-between">

        {/* NOTCH */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full translate-x-1/2" />

        {/* dashed border */}
        <div className="absolute inset-2 border border-dashed border-black/20 rounded-xl" />

        {/* CONTENT */}
        <div className="relative z-10">
          <p className="text-sm font-semibold">{branchName}</p>

          <h2 className="text-xl font-extrabold tracking-tight mt-1">
            {title}
          </h2>

          <p className="text-xs opacity-60 mt-2">
            Código: {code}
          </p>
        </div>

        <p className="text-xs opacity-60">
          Válido por tiempo limitado
        </p>
      </div>

      {/* RIGHT */}
      <div className="relative w-[120px] bg-gradient-to-br from-indigo-400 to-purple-500 flex flex-col items-center justify-center text-black font-bold">

        {/* NOTCH */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full -translate-x-1/2" />

        <p className="text-xs opacity-70 text-white">{subtitle}</p>

        <p className="text-3xl font-extrabold text-white">{discount}</p>

        <p className="text-xs opacity-70 text-white">OFF</p>
      </div>
    </div>
  );
}