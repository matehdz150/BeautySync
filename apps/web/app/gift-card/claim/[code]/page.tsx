"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  getGiftCardByCode,
  claimGiftCard,
} from "@/lib/services/public/gift-cards";
import { PublicApiError } from "@/lib/errors";

import { Button } from "@/components/ui/button";
import { Gift, Loader2 } from "lucide-react";
import { usePublicAuth } from "@/context/public/PublicAuthContext";
import { PublicHeader } from "@/components/book/PublicHeader";
import { GiftCardOwned } from "@/components/giftCards/GiftCardOwned";

export default function GiftCardClaimPage() {
  const params = useParams();
  const code = params.code as string;
  const router = useRouter()

  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [needsAuth, setNeedsAuth] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const { refresh } = usePublicAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  async function handleGoogleLogin() {
    if (loadingGoogle) return;

    setLoadingGoogle(true);

    try {
      const google = (window as any).google;

      if (!google?.accounts?.id) {
        throw new Error("Google no está listo");
      }

      const idToken = await new Promise<string>((resolve, reject) => {
        google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: (resp: any) => {
            if (!resp?.credential) return reject("No credential");
            resolve(resp.credential);
          },
          use_fedcm_for_prompt: false,
        });

        google.accounts.id.prompt();
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/public/auth/google`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ idToken }),
        },
      );

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.message ?? "Login fallido");
      }

      await refresh();

      // 🔥 intentar claim automáticamente después de login
      await handleClaim();

      setNeedsAuth(false);
    } catch (e) {
      console.error(e);
      alert("No se pudo iniciar sesión");
    } finally {
      setLoadingGoogle(false);
    }
  }

  /* =========================
     LOAD
  ========================= */
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getGiftCardByCode(code);
        console.log(res);
        setData(res);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    if (code) load();
  }, [code]);

  /* =========================
     CLAIM
  ========================= */
  async function handleClaim() {
    try {
      setClaimError(null);
      setClaiming(true);

      const res = await claimGiftCard({ code });
      console.log(res);

      if (res.alreadyOwned || res.claimed) {
        setClaimed(true);
      }
    } catch (e) {
      if (e instanceof PublicApiError && e.code === "UNAUTHORIZED") {
        setNeedsAuth(true);
        return;
      }

      if (e instanceof Error) {
        setClaimError(e.message);
      } else {
        setClaimError("No se pudo reclamar la gift card");
      }
    } finally {
      setClaiming(false);
    }
  }

  /* =========================
     STATES
  ========================= */

  if (loading) {
    return <div className="p-10 text-center">Cargando gift card...</div>;
  }

  if (error) {
    return <div className="p-10 text-center">{error}</div>;
  }

  if (!data) return null;

  if (data.isExpired) {
    return <div className="p-10 text-center">Esta gift card ha expirado</div>;
  }

  if (claimed) {
  return (
    <GiftCardOwned
      branchName={data.branch?.name}
      amountCents={data.balanceCents}
      code={data.code}
      onView={() => router.push("/search")} // opcional
    />
  );
}

  /* =========================
     UI
  ========================= */

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-[360px] flex flex-col gap-4">
          {/* 🔥 BRAND */}
          <div className="text-center pt-2">
            <p className="text-2xl font-semibold tracking-tight">Belza</p>
          </div>

          {/* COVER */}
          {data.branch?.coverUrl && (
            <img
              src={data.branch.coverUrl}
              className="w-full h-40 object-cover rounded-xl"
            />
          )}

          {/* TITLE */}
          <h1 className="text-lg font-semibold text-center flex justify-center gap-2">
            Has recibido una gift card{" "}
            <Gift className="fill-amber-500" strokeWidth={1.5} />
          </h1>

          {/* BRANCH NAME */}
          <p className="text-sm text-center text-muted-foreground">
            {data.branch?.name}
          </p>

          {/* ADDRESS */}
          {data.branch?.address && (
            <p className="text-xs text-center text-muted-foreground leading-tight">
              {data.branch.address}
            </p>
          )}

          {/* CARD PREVIEW */}
          <div
            className="w-full h-[80px] rounded-xl px-3 py-2 text-white flex flex-col justify-between"
            style={{
              background: "linear-gradient(135deg, #5b5bf7, #c14ef0)",
            }}
          >
            <div className="flex justify-between items-start">
              <p className="text-[10px] opacity-80 truncate">
                {data.branch?.name}
              </p>
              <span className="text-[9px] opacity-70">{data.currency}</span>
            </div>

            <p className="text-lg font-semibold">
              ${(data.balanceCents / 100).toFixed(2)}
            </p>

            <p className="text-[9px] opacity-70 font-mono truncate">
              {data.code}
            </p>
          </div>

          {/* AUTH WARNING */}
          {needsAuth && (
            <div className="flex flex-col gap-3 items-center">
              <p className="text-xs text-red-500 text-center">
                Inicia sesión para reclamar esta gift card
              </p>

              <Button
                onClick={handleGoogleLogin}
                disabled={loadingGoogle}
                variant="outline"
                className="rounded-full w-full"
              >
                {loadingGoogle ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Iniciando sesión…
                  </>
                ) : (
                  <>
                    {/* ICONO GOOGLE */}
                    <svg
                      className="mr-2"
                      width={16}
                      height={16}
                      viewBox="0 0 48 48"
                    >
                      <path
                        fill="#FFC107"
                        d="M43.6 20.5H42V20H24v8h11.3C33.5 32.6 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 
              12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 
              24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
                      />
                    </svg>
                    Continuar con Google
                  </>
                )}
              </Button>
            </div>
          )}
          {claimError && (
            <div className="text-xs text-red-500 text-center bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {claimError}
            </div>
          )}
          {/* ACTION */}
          <Button onClick={handleClaim} className="rounded-full">
            {claiming ? "Reclamando..." : "Reclamar gift card"}
          </Button>
        </div>
      </div>
    </>
  );
}
