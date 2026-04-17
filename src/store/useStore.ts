/**
 * @/store/useStore — enhanced store with computed selectors.
 * Drop-in for pages that import from this path.
 */
"use client";
import { useStore as useBaseStore } from "@/store";
export type { Client, Vehicle, Rental, Damage, Infraction, Expense, Reservation } from "@/store";
export { useClientStats, useVehicleAlerts } from "@/store";

export interface DamageWithMeta {
  id: string; zone: string; description: string;
  severity: "MINOR" | "MODERATE" | "SEVERE";
  repaired: boolean; repairedAt: string | null; reportedAt: string;
  cost: number | null; rentalId: string | null;
  vehicleId: string; vehiclePlate: string; vehicleBrand: string; vehicleModel: string;
}

export function useStore() {
  const base = useBaseStore();

  const getRentalsByClient = (clientId: string) =>
    base.rentals.filter((r) => r.clientId === clientId);

  const getClientTotalSpent = (clientId: string) =>
    base.rentals.filter((r) => r.clientId === clientId).reduce((s, r) => s + r.paidAmount, 0);

  const getClientById = (id: string) => base.clients.find((c) => c.id === id);

  const getDamagesByClient = (clientId: string): DamageWithMeta[] => {
    const ids = new Set(base.rentals.filter((r) => r.clientId === clientId).map((r) => r.id));
    const out: DamageWithMeta[] = [];
    base.vehicles.forEach((v) =>
      v.damages.forEach((d) => {
        if (d.rentalId && ids.has(d.rentalId))
          out.push({ ...d, vehicleId: v.id, vehiclePlate: v.plate, vehicleBrand: v.brand, vehicleModel: v.model });
      })
    );
    return out;
  };

  const getInfractionsByClient = (clientId: string) =>
    base.infractions.filter((i) => i.clientId === clientId);

  const getVehicleById = (id: string) => base.vehicles.find((v) => v.id === id);

  const getRentalsByVehicle = (vehicleId: string) =>
    base.rentals.filter((r) => r.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const getVehicleTotalRevenue = (vehicleId: string) =>
    base.rentals.filter((r) => r.vehicleId === vehicleId).reduce((s, r) => s + r.paidAmount, 0);

  const getDamagesByVehicle = (vehicleId: string): DamageWithMeta[] => {
    const v = base.vehicles.find((x) => x.id === vehicleId);
    if (!v) return [];
    return v.damages.map((d) => ({ ...d, vehicleId: v.id, vehiclePlate: v.plate, vehicleBrand: v.brand, vehicleModel: v.model }));
  };

  return {
    ...base,
    getRentalsByClient, getClientTotalSpent, getClientById, getDamagesByClient,
    getInfractionsByClient, getVehicleById, getRentalsByVehicle,
    getVehicleTotalRevenue, getDamagesByVehicle,
  };
}
