"use client";

import { useEffect, useState } from "react";
import { getExploreBranches, ExploreBranch } from "@/lib/services/public/explore";

export default function Page() {
  const [branches, setBranches] = useState<ExploreBranch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExploreBranches()
      .then(setBranches)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      {branches.map((b) => (
        <div key={b.id} className="border rounded-xl p-4">
          <h2>{b.name}</h2>
        </div>
      ))}
    </div>
  );
}