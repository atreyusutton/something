import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAcres(n: number): string {
  return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)} ac`;
}

export function formatMiles(n: number): string {
  return n < 1 ? `${(n * 5280).toFixed(0)} ft` : `${n.toFixed(n < 10 ? 1 : 0)} mi`;
}
