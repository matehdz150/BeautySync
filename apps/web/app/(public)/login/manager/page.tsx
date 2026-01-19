"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Facebook, Apple } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/context/AuthContext";

export default function ManagerLogin() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);

      if (user.role === "owner" && user.needsOnboarding) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* LEFT — FORM */}
      <div className="bg-[#0E0E0E] text-white flex items-center justify-center px-10">
        <div className="mx-auto w-full max-w-sm space-y-6">
          {/* TITLE */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">
              BeautySync para profesionales
            </h1>
            <p className="text-sm text-gray-400">
              Crea una cuenta o inicia sesión para gestionar tu negocio.
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="space-y-2">
              <Label>Correo</Label>
              <Input
                className="h-12 bg-transparent text-white border-gray-700 focus-visible:ring-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input
                className="h-12 bg-transparent text-white border-gray-700 focus-visible:ring-white"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-white text-black hover:bg-gray-200"
              variant={"primary"}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Continuar
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 text-gray-500">
            <div className="flex-1 border-t border-gray-700" />
            <span className="text-xs">o</span>
            <div className="flex-1 border-t border-gray-700" />
          </div>

          {/* SOCIAL BUTTONS */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 rounded-full bg-transparent border-gray-700 text-white hover:bg-[#1a1a1a]"
            >
              <Facebook className="mr-2" />
              Continuar con Facebook
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 rounded-full bg-transparent border-gray-700 text-white hover:bg-[#1a1a1a]"
            >
              <svg className="mr-2" width={18} height={18} viewBox="0 0 48 48">
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.5 32.6 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 
                  12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 
                  24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
                />
              </svg>
              Continuar con Google
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 rounded-full bg-transparent border-gray-700 text-white hover:bg-[#1a1a1a]"
            >
              <Apple className="mr-2" />
              Continuar con Apple
            </Button>
          </div>

          {/* FOOTER */}
          <p className="text-center text-sm text-gray-400">
            ¿Eres cliente y quieres reservar una cita?
            <br />
            <span className="text-white cursor-pointer">
              Ir a la app para clientes
            </span>
          </p>
        </div>
      </div>

      {/* RIGHT — IMAGE */}
      <div className="relative hidden lg:block">
        <Image
          alt="Beauty Sync login visual"
          src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f"
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
}