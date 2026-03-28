"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function AcceptInvitePage() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token");

  type InviteData = {
    email: string;
    role: string;
    staff: {
      name: string;
      avatarUrl?: string | null;
    };
    branch: {
      name: string;
      coverUrl?: string | null;
      rating?: {
        average: number | null;
        count: number;
      };
    };
  };

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 🔥 VALIDACIONES
  const isPasswordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword;

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:8000/auth/validate-invite/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Invite not valid");
        return res.json();
      })
      .then((data) => setInvite(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function submit() {
    if (!token) return;

    if (!isPasswordValid) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!passwordsMatch) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password, // 👈 solo esto
        }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? "Could not complete invite");
      }

      router.replace("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-5xl font-bold tracking-tight mb-6">Belza</h1>

      <Card className="w-full max-w-md rounded-2xl shadow-sm">
        <CardContent className="space-y-6 p-6">
          {/* LOADING */}
          {loading && (
            <p className="flex gap-2 items-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando invitación...
            </p>
          )}

          {/* ERROR */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* FORM */}
          {invite && !loading && (
            <>
              {/* 🔥 BRANCH */}
              <div className="rounded-xl overflow-hidden border bg-white">
                {invite.branch.coverUrl && (
                  <img
                    src={invite.branch.coverUrl}
                    className="w-full h-32 object-cover"
                  />
                )}

                <div className="p-4 space-y-1">
                  <p className="font-semibold text-base">
                    {invite.branch.name}
                  </p>

                  {invite.branch.rating && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-medium">
                        {invite.branch.rating.average ?? "Nuevo"}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        ({invite.branch.rating.count})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 🔥 STAFF */}
              <div className="flex items-center gap-3 mt-2">
                {invite.staff.avatarUrl && (
                  <img
                    src={invite.staff.avatarUrl}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}

                <div>
                  <p className="font-semibold text-sm">
                    {invite.staff.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Te invitó a unirte
                  </p>
                </div>
              </div>

              {/* 🔥 EMAIL */}
              <div className="text-sm text-muted-foreground mt-2">
                Estás aceptando la invitación para:
                <br />
                <span className="font-medium text-black">
                  {invite.email}
                </span>
              </div>

              {/* PASSWORD */}
              <div className="space-y-1">
                <Label>Contraseña</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {!isPasswordValid && password.length > 0 && (
                  <p className="text-xs text-red-500">
                    Debe tener al menos 6 caracteres
                  </p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-1">
                <Label>Confirmar contraseña</Label>
                <Input
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {!passwordsMatch && confirmPassword.length > 0 && (
                  <p className="text-xs text-red-500">
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>

              <Button
                className="w-full rounded-xl"
                disabled={
                  !password ||
                  !confirmPassword ||
                  !isPasswordValid ||
                  !passwordsMatch ||
                  loading
                }
                onClick={submit}
              >
                Crear cuenta
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}