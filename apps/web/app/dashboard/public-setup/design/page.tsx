"use client";

import { useEffect, useRef, useState } from "react";
import { Star, Heart, Share2, Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBranch } from "@/context/BranchContext";
import { addBranchImage, getBranchImages } from "@/lib/services/branch-images";
import { uploadImage } from "@/lib/services/uploads";

type Image = {
  id: string;
  url: string;
  isCover?: boolean;
};

export default function PublicPresenceCustomizePage() {
  const { branch } = useBranch();
  const name = branch?.name ?? "Nombre del negocio";
  const DEMO_IMAGES: Image[] = [
    {
      id: "demo-1",
      url: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=2070&auto=format&fit=crop",
      isCover: true,
    },
    {
      id: "demo-2",
      url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: "demo-3",
      url: "https://images.unsplash.com/photo-1706629504952-ab5e50f5c179?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: "demo-4",
      url: "https://images.unsplash.com/photo-1634449862841-8c6e970117e5?q=80&w=983&auto=format&fit=crop",
    },
    {
      id: "demo-5",
      url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=2069&auto=format&fit=crop",
    },
  ];

  const MAX_IMAGES = 5;

  function buildImageSlots(realImages: Image[], demoImages: Image[]): Image[] {
    const slots: Image[] = [...demoImages];

    if (realImages.length === 0) return slots;

    // portada
    const cover = realImages.find((i) => i.isCover);
    if (cover) slots[0] = cover;

    // secundarias
    const rest = realImages.filter((i) => !i.isCover);
    rest.forEach((img, idx) => {
      if (idx + 1 < slots.length) {
        slots[idx + 1] = img;
      }
    });

    return slots.slice(0, MAX_IMAGES);
  }

  function onImageClick(index: number) {
    setActiveSlot(index);
    fileRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !branch?.id) return;

    try {
      setUploading(true);

      // 1️⃣ subir a Cloudinary
      const uploaded = await uploadImage(file, `branches/${branch.id}`);

      // 2️⃣ ¿es portada?
      const isCover = activeSlot === 0;

      // 3️⃣ asociar a branch
      await addBranchImage(branch.id, {
        url: uploaded.url,
        publicId: uploaded.publicId,
        isCover,
      });

      // 4️⃣ refetch imágenes
      const fresh = await getBranchImages(branch.id);
      setImages(fresh);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setActiveSlot(null);
      e.target.value = "";
    }
  }

  /* ---------- REAL STATE ---------- */
  const [uploading, setUploading] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ---------- FETCH REAL IMAGES ---------- */
  useEffect(() => {
    if (!branch?.id) return;

    getBranchImages(branch.id)
      .then((data) => setImages(data))
      .catch(() => setImages([]));
  }, [branch?.id]);

  /* ---------- RESOLVER IMÁGENES ---------- */
  const resolvedImages = buildImageSlots(images, DEMO_IMAGES);

  return (
    <div className="min-h-dvh bg-white overflow-y-auto">
      <input ref={fileRef} type="file" hidden onChange={handleFileChange} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-10">
          {/* ================= HEADER ================= */}
          <header className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold">{name}</h1>

              <div className="flex gap-2">
                <IconButton icon={<Share2 height={20} width={20} />} />
                <IconButton icon={<Heart height={20} width={20} />} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-amber-500" />
                5.0
              </span>
              <span className="underline">(17)</span>
              <span>• Abierto</span>
              <span>• {branch?.address}</span>
              <span className="text-indigo-600 underline cursor-pointer">
                Cómo llegar
              </span>
            </div>
          </header>

          {/* ================= IMAGES GRID ================= */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* HERO */}
            <div className="lg:col-span-2">
              <ImageBox
                image={resolvedImages[0]}
                onClick={() => onImageClick(0)}
                loading={uploading && activeSlot === 0}
                className="aspect-[13.5/8] w-full"
              />
            </div>

            {/* SIDES */}
            <div className="grid grid-cols-2 grid-rows-2 gap-3">
              {resolvedImages.slice(1, 5).map((img, i) => (
                <ImageBox
                  key={img.id}
                  image={img}
                  onClick={() => onImageClick(i + 1)}
                  loading={uploading && activeSlot === i + 1}
                  className="aspect-4/4.3"
                />
              ))}
            </div>
          </section>

          {/* ================= SERVICES + CTA (FLEX) ================= */}
          {/* ✅ siempre debajo: flujo normal, sin sticky/fixed */}
          <section>
            <div className="flex flex-col lg:flex-row gap-12 items-start">
              {/* LEFT */}
              <div className="flex-1 space-y-6 min-w-0">
                <h2 className="text-xl font-semibold">Servicios disponibles</h2>

                <div className="space-y-3">
                  <ServiceRow
                    name="Manicure clásico"
                    duration="45 min"
                    price="$350 MXN"
                  />
                  <ServiceRow
                    name="Pedicure spa"
                    duration="60 min"
                    price="$520 MXN"
                  />
                  <ServiceRow
                    name="Gel semipermanente"
                    duration="75 min"
                    price="$650 MXN"
                  />
                </div>
              </div>

              {/* RIGHT */}
              <div className="w-full lg:w-[340px] flex-shrink-0">
                <div className="rounded-2xl border bg-white p-5 space-y-4">
                  <div className="space-y-1">
                    <p className="font-medium">¿Listo para reservar?</p>
                    <p className="text-sm text-muted-foreground">
                      Elige un servicio y agenda tu cita en segundos.
                    </p>
                  </div>

                  <Button size="lg" className="w-full rounded-full">
                    Reservar ahora
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Confirmación inmediata
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}

/* =====================
   IMAGE BOX
===================== */

function ImageBox({
  image,
  onClick,
  loading,
  className,
}: {
  image?: Image;
  onClick: () => void;
  loading?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "relative rounded-2xl overflow-hidden bg-gray-100 group",
        className
      )}
    >
      {image && (
        <img
          src={image.url}
          className={cn(
            "w-full h-full object-cover transition",
            loading && "opacity-40"
          )}
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center text-white">
        {loading ? (
          <span className="text-sm">Subiendo…</span>
        ) : (
          <>
            <Camera className="w-6 h-6" />
            <span className="text-sm">Cambiar imagen</span>
          </>
        )}
      </div>
    </button>
  );
}

function IconButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="w-10 h-10 rounded-full border flex items-center justify-center bg-black text-white">
      {icon}
    </button>
  );
}

function ServiceRow({
  name,
  duration,
  price,
}: {
  name: string;
  duration: string;
  price: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-white px-5 py-4 hover:bg-gray-50 transition">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{duration}</p>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-medium">{price}</span>
        <Button variant="outline" size="sm" className="rounded-full">
          Reservar
        </Button>
      </div>
    </div>
  );
}
