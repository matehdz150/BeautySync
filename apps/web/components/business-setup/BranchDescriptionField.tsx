"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { generateBranchDescription } from "@/lib/services/ai/ai";
import { useBranch } from "@/context/BranchContext";

type Props = {
  value: string;
  onChange: (next: string) => void;
  className?: string;
};

type AbortRef = { aborted: boolean };

export function BranchDescriptionField({ value, onChange, className }: Props) {
  const { branch } = useBranch();
  const branchId = branch?.id;

  const [aiLoading, setAiLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortRef>({ aborted: false });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function stopTyping() {
    abortRef.current.aborted = true;
    setIsTyping(false);
  }

  useEffect(() => {
    return () => stopTyping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function splitIntoWordChunks(text: string) {
    // separa en tokens tipo: ["Hola", " ", "mundo", ".", " "]
    // para que se vea natural al escribir
    return text.match(/\S+|\s+/g) ?? [];
  }

  function delayForToken(token: string) {
    const t = token.trim();

    if (!t) return 0;

    // pausas naturales
    if (/[.!?]$/.test(t)) return 180;
    if (/[,;:]$/.test(t)) return 110;
    if (t.length >= 10) return 55;

    return 35;
  }

  async function typewriterWordByWord(text: string) {
    // cancelar cualquier typing anterior
    abortRef.current.aborted = true;
    abortRef.current = { aborted: false };

    setIsTyping(true);

    // efecto real: fade-out corto antes de reemplazar
    // (sin borrar de golpe)
    const prev = value?.trim() ? value : "";
    if (prev) {
      // mini pausa para que se sienta “reemplazo”
      await new Promise((r) => setTimeout(r, 120));
    }

    // reemplazo suave: primero ponemos vacío (pero no “flash”)
    onChange("");
    await new Promise((r) => setTimeout(r, 60));

    const tokens = splitIntoWordChunks(text);

    let current = "";

    for (const token of tokens) {
      if (abortRef.current.aborted) return;

      current += token;
      onChange(current);

      // autoscroll para textos largos
      requestAnimationFrame(() => {
        if (!textareaRef.current) return;
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      });

      const d = delayForToken(token);
      if (d > 0) await new Promise((r) => setTimeout(r, d));
    }

    setIsTyping(false);
  }

  async function generateDescriptionWithAI() {
    if (!branchId) {
      setError("No se encontró la sucursal.");
      return;
    }

    setAiLoading(true);
    setError(null);

    try {
      const res = await generateBranchDescription(branchId);

      const description =
        res?.description ??
        res?.data?.description ??
        res?.result?.description ??
        "";

      if (!description || typeof description !== "string") {
        throw new Error("Respuesta inválida de IA");
      }

      await typewriterWordByWord(description);
    } catch (e) {
      console.error(e);
      setError("No se pudo generar la descripción. Intenta otra vez.");
      setIsTyping(false);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold">Descripción</p>
          <p className="text-sm text-muted-foreground mt-1">
            Esto ayuda muchísimo a que te elijan.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(aiLoading || isTyping) && (
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={stopTyping}
            >
              Detener
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={generateDescriptionWithAI}
            disabled={aiLoading || isTyping || !branchId}
            className={cn(
              "relative overflow-hidden rounded-full gap-2 shrink-0",
              "border-black/10 bg-white",
              "transition-all",
              (aiLoading || isTyping) && "border-indigo-400/40"
            )}
          >
            {/* 🔥 Glow blur detrás (solo cuando está generando/escribiendo) */}
            {(aiLoading || isTyping) && (
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-6 rounded-full
      bg-indigo-400/30 blur-2xl opacity-80"
              />
            )}

            {/* 🔥 Shimmer animado (barrido) */}
            {(aiLoading || isTyping) && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-70"
              >
                <span
                  className="absolute inset-0 translate-x-[-120%] animate-[shine_1.2s_linear_infinite]
        bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"
                />
              </span>
            )}

            {/* Contenido real */}
            <span className="relative z-10 inline-flex items-center gap-2">
              <Sparkles
                className={cn(
                  "h-4 w-4 text-indigo-500 transition",
                  (aiLoading || isTyping) && "animate-pulse text-indigo-400"
                )}
              />

              <span className="font-medium">
                {aiLoading
                  ? "Generando..."
                  : isTyping
                  ? "Escribiendo..."
                  : "Generar con IA"}
              </span>

              {/* 🔥 Mini loader */}
              {(aiLoading || isTyping) && (
                <span className="ml-1 inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" />
                </span>
              )}
            </span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="relative">
        <Textarea
          ref={(node) => {
            textareaRef.current = node;
          }}
          value={value}
          onChange={(e) => {
            // si el user toca el textarea mientras escribe → paramos
            if (isTyping) stopTyping();
            onChange(e.target.value);
          }}
          placeholder="Ej. Cortes premium, barba y atención rápida..."
          className={cn(
            "min-h-[200px] rounded-2xl border-2 border-black/10 bg-white px-5 py-4",
            "text-lg leading-relaxed shadow-none",
            isTyping && "pr-10" // espacio para cursor
          )}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{value.trim().length} caracteres</span>
        <span className={cn(isTyping ? "opacity-100" : "opacity-0")}>
          Generando descripción…
        </span>
      </div>
    </div>
  );
}
