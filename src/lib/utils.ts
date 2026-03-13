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

export function slotLabel(slot: "SLOT_19H00" | "SLOT_20H45"): string {
  return slot === "SLOT_19H00" ? "19h00" : "20h45";
}
