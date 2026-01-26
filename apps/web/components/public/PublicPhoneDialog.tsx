"use client";

import { useMemo, useState } from "react";
import { Loader2, Phone, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
};

type Country = {
  code: "MX" | "US";
  name: string;
  dialCode: string; // "+52"
  flag: string;
  minDigits: number;
  maxDigits: number;
};

const COUNTRIES: Country[] = [
  {
    code: "MX",
    name: "México",
    dialCode: "+52",
    flag: "🇲🇽",
    minDigits: 10,
    maxDigits: 10,
  },
  {
    code: "US",
    name: "Estados Unidos",
    dialCode: "+1",
    flag: "🇺🇸",
    minDigits: 10,
    maxDigits: 10,
  },
];

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function buildE164(country: Country, nationalNumber: string) {
  const digits = onlyDigits(nationalNumber);
  if (!digits) return "";
  return `${country.dialCode}${digits}`;
}

export function PublicPhoneDialog({ open, onOpenChange, onSaved }: Props) {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]); // MX default
  const [nationalNumber, setNationalNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = useMemo(() => onlyDigits(nationalNumber), [nationalNumber]);
  const phoneE164 = useMemo(() => buildE164(country, digits), [country, digits]);

  const isValid = useMemo(() => {
    if (!digits) return false;
    return (
      digits.length >= country.minDigits && digits.length <= country.maxDigits
    );
  }, [digits, country]);

  async function savePhone() {
    if (saving) return;

    setError(null);

    if (!isValid) {
      setError(`Escribe un número válido (${country.name})`);
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/public/phone`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ phoneE164 }),
        }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.message ?? "No se pudo guardar el teléfono");
      }

      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      setError(err?.message ?? "Error guardando teléfono");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && saving) return;
        onOpenChange(v);
      }}
    >
      <DialogContent
        className="w-[calc(100%-24px)] max-w-[420px] rounded-3xl border bg-background/95 shadow-2xl backdrop-blur-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border bg-muted">
              <Phone className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl leading-tight">
                Confirma tu número
              </DialogTitle>
              <DialogDescription className="text-sm">
                Lo usaremos para contactarte sobre tu reservación.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-3 pt-1">
          {/* input row */}
          <div className="grid grid-cols-[120px_1fr] gap-2">
            {/* Country selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 justify-between rounded-2xl px-3"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm font-medium truncate">
                      {country.dialCode}
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                className="w-[240px] rounded-2xl"
              >
                {COUNTRIES.map((c) => (
                  <DropdownMenuItem
                    key={c.code}
                    onClick={() => setCountry(c)}
                    className="flex items-center justify-between gap-3 rounded-xl"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{c.flag}</span>
                      <span className="text-sm">{c.name}</span>
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {c.dialCode}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Number input */}
            <Input
              value={nationalNumber}
              onChange={(e) => setNationalNumber(onlyDigits(e.target.value))}
              placeholder="3312345678"
              className="h-12 rounded-2xl"
              inputMode="numeric"
              autoComplete="tel-national"
            />
          </div>

          {/* preview */}
          <p className="text-xs text-muted-foreground">
            Se guardará como:{" "}
            <span className="font-medium text-foreground">
              {phoneE164 || "—"}
            </span>
          </p>

          <Button
            onClick={savePhone}
            disabled={saving || !isValid}
            className="w-full h-12 rounded-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Guardando…
              </>
            ) : (
              "Continuar"
            )}
          </Button>

          <p className="text-center text-[11px] leading-snug text-muted-foreground">
            Después agregamos SMS, por ahora solo lo guardamos.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}