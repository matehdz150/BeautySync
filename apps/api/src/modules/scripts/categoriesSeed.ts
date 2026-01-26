/* eslint-disable prettier/prettier */
import "dotenv/config";
import { db } from "../db/client";
import { serviceCategories } from "src/modules/db/schema";

async function main() {
  console.log("🧾 Cargando categorías…");

  const categories = [
    { name: "Cortes", icon: "Scissors", colorHex: "#6C63FF" },
    { name: "Peinados", icon: "Brush", colorHex: "#A78BFA" },
    { name: "Coloración", icon: "Palette", colorHex: "#F472B6" },
    { name: "Tratamientos Capilares", icon: "Droplet", colorHex: "#60A5FA" },
    { name: "Barbería", icon: "Beard", colorHex: "#6B7280" },

    { name: "Manicura", icon: "Hand", colorHex: "#FB7185" },
    { name: "Pedicura", icon: "Footprints", colorHex: "#FDA4AF" },
    { name: "Uñas Acrílicas", icon: "Sparkles", colorHex: "#FBCFE8" },
    { name: "Gel Polish", icon: "Brush", colorHex: "#F9A8D4" },
    { name: "Arte en Uñas", icon: "Star", colorHex: "#FBBF24" },

    { name: "Maquillaje", icon: "Heart", colorHex: "#F472B6" },
    { name: "Maquillaje Social", icon: "PartyPopper", colorHex: "#FB923C" },
    { name: "Maquillaje de Novia", icon: "Diamond", colorHex: "#FBCFE8" },
    { name: "Pestañas", icon: "Eye", colorHex: "#A855F7" },
    { name: "Cejas", icon: "Eye", colorHex: "#7C3AED" },

    { name: "Depilación", icon: "Sparkles", colorHex: "#FBBF24" },
    { name: "Cera", icon: "Droplet", colorHex: "#FB7185" },
    { name: "Láser", icon: "Zap", colorHex: "#22C55E" },
    { name: "Hilo", icon: "SewingPin", colorHex: "#E879F9" },
    { name: "Depilación Facial", icon: "Smile", colorHex: "#A1A1AA" },

    { name: "Faciales", icon: "Flower2", colorHex: "#4ADE80" },
    { name: "Limpieza Facial", icon: "Sparkles", colorHex: "#34D399" },
    { name: "Anti-Edad", icon: "Stars", colorHex: "#60A5FA" },
    { name: "Hidratación", icon: "Droplet", colorHex: "#38BDF8" },
    { name: "Acné", icon: "AlertCircle", colorHex: "#FB7185" },

    { name: "Masajes", icon: "Lotus", colorHex: "#10B981" },
    { name: "Relajación", icon: "Cloud", colorHex: "#22C55E" },
    { name: "Descontracturante", icon: "Activity", colorHex: "#0EA5E9" },
    { name: "Masaje Deportivo", icon: "Dumbbell", colorHex: "#2563EB" },
    { name: "Masaje Terapéutico", icon: "Stethoscope", colorHex: "#4B5563" },

    { name: "Spa", icon: "Leaf", colorHex: "#6EE7B7" },
    { name: "Baños de Vapor", icon: "HotSquare", colorHex: "#FACC15" },
    { name: "Aromaterapia", icon: "Flower2", colorHex: "#2DD4BF" },
    { name: "Exfoliación Corporal", icon: "Droplet", colorHex: "#67E8F9" },
    { name: "Envolturas", icon: "Package", colorHex: "#A5B4FC" },

    { name: "Cuidado de Piel", icon: "Sun", colorHex: "#FBBF24" },
    { name: "Microdermoabrasión", icon: "Diamond", colorHex: "#818CF8" },
    { name: "Peelings", icon: "FlaskRound", colorHex: "#FB7185" },
    { name: "Radiofrecuencia", icon: "Radio", colorHex: "#7C3AED" },
    { name: "Dermaplaning", icon: "Scalpel", colorHex: "#6B7280" },

    { name: "Salud y Bienestar", icon: "HeartPulse", colorHex: "#22C55E" },
    { name: "Coaching", icon: "UserRoundCheck", colorHex: "#0EA5E9" },
    { name: "Nutrición", icon: "Apple", colorHex: "#F97316" },
    { name: "Mindfulness", icon: "Sparkles", colorHex: "#38BDF8" },
    { name: "Meditación", icon: "Vibrate", colorHex: "#3B82F6" },

    { name: "Cursos y Talleres", icon: "GraduationCap", colorHex: "#7C3AED" },
    { name: "Asesorías", icon: "MessageSquare", colorHex: "#60A5FA" },
    { name: "Consultoría", icon: "NotebookPen", colorHex: "#4ADE80" },
    { name: "Eventos", icon: "Calendar", colorHex: "#F59E0B" },
    { name: "Otros Servicios", icon: "CircleHelp", colorHex: "#9CA3AF" },
  ];

  await db
    .insert(serviceCategories)
    .values(categories)
    .onConflictDoNothing({
      target: serviceCategories.name, // 👈 clave única
    });

  console.log("✅ Categorías listas 🎉");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});