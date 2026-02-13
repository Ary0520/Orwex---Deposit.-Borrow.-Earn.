import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatNumber(value: string | number, decimals: number = 4): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0.00";
  if (num === 0) return "0.00";
  if (num < 0.0001) return "< 0.0001";
  return num.toFixed(decimals);
}

export function calculateHealthFactorColor(healthFactor: number): "green" | "blue" | "purple" | "yellow" | "red" {
  if (healthFactor === Infinity) return "green";
  if (healthFactor >= 1.5) return "green";
  if (healthFactor >= 1.2) return "yellow";
  return "red";
}
