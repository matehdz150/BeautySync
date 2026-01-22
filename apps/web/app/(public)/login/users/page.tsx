"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePublicAuth } from "@/context/public/PublicAuthContext";

type PublicUsersLoginProps = {
  title?: string;
  subtitle?: string;
  onSuccessRedirectTo?: string; // ej: `/book/${slug}`
};

export default function PublicUsersLogin({
  title = "BeautySync para clientes",
  subtitle = "Inicia sesión para confirmar tu cita y gestionar tus reservas.",
  onSuccessRedirectTo,
}: PublicUsersLoginProps) {
  const router = useRouter();
  const {refresh} = usePublicAuth();

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    if (loadingGoogle) return;

    setError(null);
    setLoadingGoogle(true);

    try {
      const google = (window as any).google;
      if (!google?.accounts?.id) {
        throw new Error("Google Identity Services no cargó todavía");
      }

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error("Falta NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      }

      const idToken = await new Promise<string>((resolve, reject) => {
        google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: (resp: any) => {
            if (!resp?.credential) return reject(new Error("No credential"));
            resolve(resp.credential); 
          },
          use_fedcm_for_prompt: false,
        });

        google.accounts.id.prompt((n: any) => {
          if (n.isNotDisplayed?.()) reject(new Error("Prompt not displayed"));
          if (n.isSkippedMoment?.()) reject(new Error("Prompt skipped"));
          if (n.isDismissedMoment?.()) reject(new Error("Prompt dismissed"));
        });
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/public/auth/google`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // 🔥 para que guarde cookie pubsid
          body: JSON.stringify({ idToken }),
        }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.message ?? "No se pudo iniciar sesión con Google"
        );
      }

      await refresh();

      router.push('/explore');
    } catch (err: any) {
      setError(err?.message ?? "Error al iniciar sesión con Google");
    } finally {
      setLoadingGoogle(false);
    }
  }


  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* LEFT — FORM */}
      <div className="bg-[#0E0E0E] text-white flex items-center justify-center px-10">
        <div className="mx-auto w-full max-w-sm space-y-6">
          {/* TITLE */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-gray-400">{subtitle}</p>
          </div>

          {/* ERROR */}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          {/* SOCIAL BUTTONS */}
          <div className="space-y-3">
            <Button
              onClick={handleGoogleLogin}
              disabled={loadingGoogle}
              variant="outline"
              className={cn(
                "w-full h-12 rounded-full",
                "bg-transparent border-gray-700 text-white",
                "hover:bg-[#1a1a1a]"
              )}
            >
              {loadingGoogle ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Iniciando sesión…
                </>
              ) : (
                <>
                  <svg
                    className="mr-2"
                    width={18}
                    height={18}
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

          {/* FOOTER */}
          <p className="text-center text-sm text-gray-400">
            ¿Eres profesional y quieres gestionar tu negocio?
            <br />
            <span
              className="text-white cursor-pointer"
              onClick={() => router.push("/login/manager")}
            >
              Ir a BeautySync para profesionales
            </span>
          </p>
        </div>
      </div>

      {/* RIGHT — IMAGE */}
      <div className="relative hidden lg:block">
        <Image
          alt="BeautySync clients login visual"
          src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
