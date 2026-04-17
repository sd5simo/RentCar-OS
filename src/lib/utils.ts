import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMAD(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateLong(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function calculateDays(start: Date, end: Date): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    AVAILABLE: "text-brand-green-400 bg-brand-green-500/10 border-brand-green-500/20",
    RENTED: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    MAINTENANCE: "text-brand-orange-400 bg-brand-orange-500/10 border-brand-orange-500/20",
    OUT_OF_SERVICE: "text-red-400 bg-red-500/10 border-red-500/20",
    ACTIVE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    COMPLETED: "text-brand-green-400 bg-brand-green-500/10 border-brand-green-500/20",
    CANCELLED: "text-red-400 bg-red-500/10 border-red-500/20",
    PENDING: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    CONFIRMED: "text-brand-green-400 bg-brand-green-500/10 border-brand-green-500/20",
    CONVERTED: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };
  return map[status] ?? "text-slate-400 bg-slate-500/10 border-slate-500/20";
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    AVAILABLE: "Disponible",
    RENTED: "Loué",
    MAINTENANCE: "Maintenance",
    OUT_OF_SERVICE: "Hors service",
    ACTIVE: "En cours",
    COMPLETED: "Terminé",
    CANCELLED: "Annulé",
    PENDING: "En attente",
    CONFIRMED: "Confirmé",
    CONVERTED: "Converti",
    ECONOMY: "Économique",
    COMFORT: "Confort",
    LUXURY: "Luxe",
    SUV: "SUV",
    VAN: "Van",
    DIESEL: "Diesel",
    ESSENCE: "Essence",
    HYBRID: "Hybride",
    ELECTRIC: "Électrique",
    MANUAL: "Manuelle",
    AUTOMATIC: "Automatique",
  };
  return map[status] ?? status;
}

export function getMonthName(monthNum: number): string {
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  return months[monthNum - 1] ?? "";
}

export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
