/**
 * Zustand store — NO localStorage persistence.
 * Data is loaded from the DB via API routes on app mount (useDataLoader hook).
 * Every mutation calls the API then updates local state optimistically.
 */
import { create } from "zustand";
import {
  clientsApi,
  vehiclesApi,
  rentalsApi,
  reservationsApi,
  expensesApi,
  infractionsApi,
  damagesApi,
} from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Client {
  id: string; cin: string; firstName: string; lastName: string;
  email: string | null; phone: string; address: string | null; city: string | null;
  licenseNum: string | null; licenseExp: string | null;
  isBlacklist: boolean; blacklistReason: string | null; blacklistedAt: string | null;
  createdAt: string; notes: string | null;
}

export interface Damage {
  id: string; zone: string; description: string;
  severity: "MINOR" | "MODERATE" | "SEVERE";
  repaired: boolean; repairedAt: string | null; reportedAt: string;
  cost: number | null; rentalId: string | null;
}

export interface Vehicle {
  id: string; plate: string; brand: string; model: string; year: number;
  category: string; color: string; fuelType: string; transmission: string;
  seats: number; dailyRate: number;
  status: "AVAILABLE" | "RENTED" | "MAINTENANCE" | "OUT_OF_SERVICE";
  mileage: number; lastOilChangeMileage: number; nextOilChangeMileage: number;
  technicalInspectionDate: string | null; insuranceExpiry: string | null;
  vignetteExpiry: string | null; notes: string | null; createdAt: string;
  damages: Damage[];
}

export interface Rental {
  id: string; contractNum: string; clientId: string; vehicleId: string;
  startDate: string; endDate: string; returnDate: string | null;
  dailyRate: number; totalDays: number; totalAmount: number; paidAmount: number;
  deposit: number; depositReturned: boolean;
  fuelLevelStart: string; fuelLevelEnd: string | null;
  mileageStart: number; mileageEnd: number | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  extras: { label: string; amount: number }[];
  notes: string | null; createdAt: string;
}

export interface Reservation {
  id: string; refCode: string; clientId: string; vehicleId: string;
  startDate: string; endDate: string; totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "CONVERTED";
  notes: string | null; createdAt: string;
}

export interface Expense {
  id: string; vehicleId: string | null; category: string;
  description: string; amount: number; date: string;
  vendor: string | null; createdAt: string;
}

export interface Infraction {
  id: string; clientId: string; rentalId: string | null; type: string;
  description: string; amount: number | null; date: string;
  resolved: boolean; createdAt: string;
}

// ── Store interface ───────────────────────────────────────────────────────────
interface AppState {
  // Data
  clients: Client[];
  vehicles: Vehicle[];
  rentals: Rental[];
  reservations: Reservation[];
  expenses: Expense[];
  infractions: Infraction[];

  // Loading / error state
  loading: boolean;
  error: string | null;

  // Hydration
  loadAll: () => Promise<void>;
  setClients: (c: Client[]) => void;
  setVehicles: (v: Vehicle[]) => void;
  setRentals: (r: Rental[]) => void;
  setReservations: (r: Reservation[]) => void;
  setExpenses: (e: Expense[]) => void;
  setInfractions: (i: Infraction[]) => void;

  // ── Client actions ──────────────────────────────────────────────────────────
  addClient:      (data: Omit<Client, "id" | "createdAt">) => Promise<Client>;
  updateClient:   (id: string, data: Partial<Client>)      => Promise<void>;
  deleteClient:   (id: string)                             => Promise<void>;
  toggleBlacklist:(id: string, reason?: string)            => Promise<void>;

  // ── Vehicle actions ─────────────────────────────────────────────────────────
  addVehicle:    (data: Omit<Vehicle, "id" | "damages" | "createdAt">) => Promise<Vehicle>;
  updateVehicle: (id: string, data: Partial<Vehicle>)                  => Promise<void>;
  deleteVehicle: (id: string)                                          => Promise<void>;
  addDamage:     (vehicleId: string, d: Omit<Damage, "id" | "reportedAt">) => Promise<void>;
  repairDamage:  (vehicleId: string, damageId: string, cost: number)        => Promise<void>;

  // ── Rental actions ──────────────────────────────────────────────────────────
  addRental:    (data: Omit<Rental, "id" | "contractNum" | "createdAt">) => Promise<string>;
  updateRental: (id: string, data: Partial<Rental>)                      => Promise<void>;
  closeRental:  (id: string, mileageEnd: number, fuelEnd: string, returnDate: string) => Promise<void>;
  deleteRental: (id: string)                                             => Promise<void>;

  // ── Reservation actions ─────────────────────────────────────────────────────
  addReservation:     (data: Omit<Reservation, "id" | "refCode" | "createdAt">) => Promise<void>;
  updateReservation:  (id: string, data: Partial<Reservation>)                  => Promise<void>;
  confirmReservation: (id: string)                                               => Promise<void>;
  cancelReservation:  (id: string)                                               => Promise<void>;
  deleteReservation:  (id: string)                                               => Promise<void>;

  // ── Expense actions ─────────────────────────────────────────────────────────
  addExpense:    (data: Omit<Expense, "id" | "createdAt">) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>)      => Promise<void>;
  deleteExpense: (id: string)                              => Promise<void>;

  // ── Infraction actions ──────────────────────────────────────────────────────
  addInfraction:     (data: Omit<Infraction, "id" | "createdAt">) => Promise<void>;
  resolveInfraction: (id: string)                                  => Promise<void>;
  deleteInfraction:  (id: string)                                  => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  clients: [], vehicles: [], rentals: [], reservations: [],
  expenses: [], infractions: [], loading: false, error: null,

  // ── Setters (used by loader) ──────────────────────────────────────────────
  setClients:      (clients)      => set({ clients }),
  setVehicles:     (vehicles)     => set({ vehicles }),
  setRentals:      (rentals)      => set({ rentals }),
  setReservations: (reservations) => set({ reservations }),
  setExpenses:     (expenses)     => set({ expenses }),
  setInfractions:  (infractions)  => set({ infractions }),

  // ── Load all data from DB ─────────────────────────────────────────────────
  loadAll: async () => {
    set({ loading: true, error: null });
    try {
      const [clients, vehicles, rentals, reservations, expenses, infractions] =
        await Promise.all([
          clientsApi.list(),
          vehiclesApi.list(),
          rentalsApi.list(),
          reservationsApi.list(),
          expensesApi.list(),
          infractionsApi.list(),
        ]);
      set({ clients, vehicles, rentals, reservations, expenses, infractions, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  // ── Clients ──────────────────────────────────────────────────────────────
  addClient: async (data) => {
    const created = await clientsApi.create(data);
    set((s) => ({ clients: [created, ...s.clients] }));
    return created;
  },
  updateClient: async (id, data) => {
    const updated = await clientsApi.update(id, data);
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? updated : c)) }));
  },
  deleteClient: async (id) => {
    await clientsApi.remove(id);
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
  },
  toggleBlacklist: async (id, reason) => {
    const client = get().clients.find((c) => c.id === id);
    if (!client) return;
    const nowBlacklisted = !client.isBlacklist;
    const updated = await clientsApi.update(id, {
      isBlacklist:     nowBlacklisted,
      blacklistReason: nowBlacklisted ? (reason ?? null) : null,
      blacklistedAt:   nowBlacklisted ? new Date().toISOString().slice(0, 10) : null,
    });
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? updated : c)) }));
  },

  // ── Vehicles ─────────────────────────────────────────────────────────────
  addVehicle: async (data) => {
    const created = await vehiclesApi.create(data);
    set((s) => ({ vehicles: [created, ...s.vehicles] }));
    return created;
  },
  updateVehicle: async (id, data) => {
    const updated = await vehiclesApi.update(id, data);
    set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? updated : v)) }));
  },
  deleteVehicle: async (id) => {
    await vehiclesApi.remove(id);
    set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) }));
  },
  addDamage: async (vehicleId, d) => {
    const damage = await damagesApi.create({ vehicleId, ...d });
    set((s) => ({
      vehicles: s.vehicles.map((v) =>
        v.id === vehicleId ? { ...v, damages: [damage, ...v.damages] } : v
      ),
    }));
  },
  repairDamage: async (vehicleId, damageId, cost) => {
    const updated = await damagesApi.update(damageId, { repaired: true, cost });
    set((s) => ({
      vehicles: s.vehicles.map((v) =>
        v.id === vehicleId
          ? { ...v, damages: v.damages.map((d) => (d.id === damageId ? updated : d)) }
          : v
      ),
    }));
  },

  // ── Rentals ───────────────────────────────────────────────────────────────
  addRental: async (data) => {
    const created = await rentalsApi.create(data);
    set((s) => ({
      rentals:  [created, ...s.rentals],
      // Optimistically mark vehicle as RENTED
      vehicles: s.vehicles.map((v) =>
        v.id === data.vehicleId ? { ...v, status: "RENTED" } : v
      ),
    }));
    return created.contractNum;
  },
  updateRental: async (id, data) => {
    const updated = await rentalsApi.update(id, data);
    set((s) => ({ rentals: s.rentals.map((r) => (r.id === id ? updated : r)) }));
  },
  closeRental: async (id, mileageEnd, fuelEnd, returnDate) => {
    const rental = get().rentals.find((r) => r.id === id);
    if (!rental) return;
    const updated = await rentalsApi.update(id, {
      status: "COMPLETED",
      mileageEnd,
      fuelLevelEnd: fuelEnd,
      returnDate,
      vehicleId: rental.vehicleId, // sent so API can update vehicle
    });
    set((s) => ({
      rentals: s.rentals.map((r) => (r.id === id ? updated : r)),
      vehicles: s.vehicles.map((v) =>
        v.id === rental.vehicleId
          ? { ...v, status: "AVAILABLE", mileage: mileageEnd }
          : v
      ),
    }));
  },
  deleteRental: async (id) => {
    await rentalsApi.remove(id);
    set((s) => ({ rentals: s.rentals.filter((r) => r.id !== id) }));
  },

  // ── Reservations ──────────────────────────────────────────────────────────
  addReservation: async (data) => {
    const created = await reservationsApi.create(data);
    set((s) => ({ reservations: [created, ...s.reservations] }));
  },
  updateReservation: async (id, data) => {
    const updated = await reservationsApi.update(id, data);
    set((s) => ({ reservations: s.reservations.map((r) => (r.id === id ? updated : r)) }));
  },
  confirmReservation: async (id) => {
    const updated = await reservationsApi.update(id, { status: "CONFIRMED" });
    set((s) => ({ reservations: s.reservations.map((r) => (r.id === id ? updated : r)) }));
  },
  cancelReservation: async (id) => {
    const updated = await reservationsApi.update(id, { status: "CANCELLED" });
    set((s) => ({ reservations: s.reservations.map((r) => (r.id === id ? updated : r)) }));
  },
  deleteReservation: async (id) => {
    await reservationsApi.remove(id);
    set((s) => ({ reservations: s.reservations.filter((r) => r.id !== id) }));
  },

  // ── Expenses ──────────────────────────────────────────────────────────────
  addExpense: async (data) => {
    const created = await expensesApi.create(data);
    set((s) => ({ expenses: [created, ...s.expenses] }));
  },
  updateExpense: async (id, data) => {
    const updated = await expensesApi.update(id, data);
    set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? updated : e)) }));
  },
  deleteExpense: async (id) => {
    await expensesApi.remove(id);
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
  },

  // ── Infractions ───────────────────────────────────────────────────────────
  addInfraction: async (data) => {
    const created = await infractionsApi.create(data);
    set((s) => ({ infractions: [created, ...s.infractions] }));
  },
  resolveInfraction: async (id) => {
    const updated = await infractionsApi.update(id, { resolved: true });
    set((s) => ({ infractions: s.infractions.map((i) => (i.id === id ? updated : i)) }));
  },
  deleteInfraction: async (id) => {
    await infractionsApi.remove(id);
    set((s) => ({ infractions: s.infractions.filter((i) => i.id !== id) }));
  },
}));

// ── Computed selectors (unchanged API) ───────────────────────────────────────
export function useClientStats(clientId: string) {
  const { rentals, infractions } = useStore();
  const clientRentals = rentals.filter((r) => r.clientId === clientId);
  const clientInfractions = infractions.filter((i) => i.clientId === clientId);
  const totalSpent = clientRentals.reduce((s, r) => s + r.paidAmount, 0);
  const totalDays = clientRentals.reduce((s, r) => s + r.totalDays, 0);
  const avgPerRental = clientRentals.length > 0 ? totalSpent / clientRentals.length : 0;
  const activeRental = clientRentals.find((r) => r.status === "ACTIVE");
  return { clientRentals, clientInfractions, totalSpent, totalDays, avgPerRental, activeRental };
}

export function useVehicleAlerts(vehicle: Vehicle | undefined) {
  if (!vehicle) return [];
  const alerts: { severity: "CRITICAL" | "WARNING"; type: string; msg: string }[] = [];
  const now = Date.now(); const day = 86400000;
  const oilLeft = vehicle.nextOilChangeMileage - vehicle.mileage;
  if (oilLeft <= 0)    alerts.push({ severity: "CRITICAL", type: "Vidange",           msg: `Dépassée de ${Math.abs(oilLeft)} km` });
  else if (oilLeft <= 2000) alerts.push({ severity: "WARNING", type: "Vidange",       msg: `Dans ${oilLeft} km` });
  if (vehicle.technicalInspectionDate) {
    const d = Math.ceil((new Date(vehicle.technicalInspectionDate).getTime() - now) / day);
    if (d < 0)         alerts.push({ severity: "CRITICAL", type: "Visite technique",  msg: `Expirée (${Math.abs(d)}j)` });
    else if (d <= 30)  alerts.push({ severity: "WARNING",  type: "Visite technique",  msg: `Dans ${d}j` });
  }
  if (vehicle.insuranceExpiry) {
    const d = Math.ceil((new Date(vehicle.insuranceExpiry).getTime() - now) / day);
    if (d < 0)         alerts.push({ severity: "CRITICAL", type: "Assurance",         msg: `Expirée (${Math.abs(d)}j)` });
    else if (d <= 30)  alerts.push({ severity: "WARNING",  type: "Assurance",         msg: `Dans ${d}j` });
  }
  if (vehicle.vignetteExpiry) {
    const d = Math.ceil((new Date(vehicle.vignetteExpiry).getTime() - now) / day);
    if (d < 0)         alerts.push({ severity: "CRITICAL", type: "Vignette",          msg: `Expirée (${Math.abs(d)}j)` });
    else if (d <= 30)  alerts.push({ severity: "WARNING",  type: "Vignette",          msg: `Dans ${d}j` });
  }
  return alerts;
}
