"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { usePublicAuth } from "@/context/public/PublicAuthContext";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLoggedIn?: () => void;
};

export function PublicAuthDialog({ open, onOpenChange, onLoggedIn }: Props) {
  const {refresh} = usePublicAuth();
  const btnRef = useRef<HTMLDivElement | null>(null);

  const [ready, setReady] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) Espera a que exista window.google
  useEffect(() => {
    if (!open) return;

    setReady(false);
    setError(null);
    setLoadingLogin(false);

    let tries = 0;
    const interval = setInterval(() => {
      tries++;
      const google = (window as any).google;

      if (google?.accounts?.id) {
        setReady(true);
        clearInterval(interval);
      }

      // ~4s
      if (tries > 40) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [open]);

  // 2) Renderiza el botón oficial dentro del modal
  useEffect(() => {
    if (!open) return;
    if (!ready) return;
    if (!btnRef.current) return;

    const google = (window as any).google;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setError("Falta NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      return;
    }

    setError(null);

    google.accounts.id.initialize({
      client_id: clientId,
      callback: async (resp: any) => {
        try {
          setLoadingLogin(true);

          if (!resp?.credential) {
            throw new Error("No credential");
          }

          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/public/auth/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ idToken: resp.credential }),
            }
          );

          const json = await res.json().catch(() => null);

          if (!res.ok || !json?.ok) {
            throw new Error(
              json?.message ?? "No se pudo iniciar sesión con Google"
            );
          }

          await refresh();
          onOpenChange(false);
          onLoggedIn?.();
        } catch (e: any) {
          setError(e?.message ?? "Error al iniciar sesión con Google");
        } finally {
          setLoadingLogin(false);
        }
      },
      use_fedcm_for_prompt: false,
    });

    // limpia para evitar duplicados
    btnRef.current.innerHTML = "";

    // botón oficial (no redirect)
    google.accounts.id.renderButton(btnRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "pill",
      text: "continue_with",
      width: 360,
      locale: "es",
    });

    google.accounts.id.disableAutoSelect();
  }, [open, ready, onOpenChange, onLoggedIn]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        // mientras está autenticando, no cierres
        if (!v && loadingLogin) return;
        onOpenChange(v);
      }}
    >
      <DialogContent
        className="sm:max-w-md rounded-3xl border bg-background/95 shadow-2xl backdrop-blur-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-3">
          {/* icon header */}
          <div className="flex items-center gap-3">

            <div className="flex-1">
              <DialogTitle className="text-xl leading-tight">
                Inicia sesión para confirmar
              </DialogTitle>
              <DialogDescription className="text-sm">
                Te toma 5 segundos y tu reservación queda lista.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* error */}
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* body */}
        <div className="space-y-4 pt-1">
          <div className="rounded-2xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4" />
              <p>
                Usamos Google para identificarte y poder ligar tu reservación a
                tu perfil. <span className="font-medium">No vemos tu contraseña.</span>
              </p>
            </div>
          </div>

          {!ready ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border bg-muted/20 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando Google…
            </div>
          ) : (
            <div className="flex justify-center">
              <div ref={btnRef} />
            </div>
          )}

          {loadingLogin ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Iniciando sesión…
            </div>
          ) : null}

          <p className="text-center text-xs text-muted-foreground">
            Al continuar aceptas nuestras condiciones de uso.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}