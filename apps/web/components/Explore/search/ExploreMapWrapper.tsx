// ExploreMapWrapper.tsx

"use client";

import dynamic from "next/dynamic";

const ExploreMap = dynamic(() => import("./ExploreMap"), {
  ssr: false, // 🔥 CLAVE
});

export default ExploreMap;
