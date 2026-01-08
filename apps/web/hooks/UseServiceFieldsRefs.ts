import { useRef } from "react";

export function useServiceFieldRefs() {
  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLButtonElement>(null);

  return { nameRef, priceRef, durationRef };
}