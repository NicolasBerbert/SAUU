import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export function slotLabel(slot: string): string {
  return slot;
}

// Combina nomes de palestrantes para exibição: "A", "A & B", "A, B & C".
export function joinNames(names: string[]): string {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? "";
  return `${clean.slice(0, -1).join(", ")} & ${clean[clean.length - 1]}`;
}

// slot é texto livre ("19:00", "9h30"), então ordenar como string coloca "9:00" depois de "14:00".
// Horário não reconhecido vai para o fim.
export function slotMinutes(slot: string): number {
  const match = slot.match(/(\d{1,2})\s*[:h]?\s*(\d{2})?/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2] ?? 0);
}
