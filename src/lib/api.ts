/**
 * Centralised API client — thin wrappers around fetch()
 * All functions throw on non-2xx so callers can catch uniformly.
 */

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Clients ──────────────────────────────────────────────────────────────────
export const clientsApi = {
  list:   ()         => req<any[]>("/api/clients"),
  get:    (id: string)         => req<any>(`/api/clients/${id}`),
  create: (data: any)          => req<any>("/api/clients", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => req<any>(`/api/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string)         => req<{ ok: boolean }>(`/api/clients/${id}`, { method: "DELETE" }),
};

// ── Vehicles ─────────────────────────────────────────────────────────────────
export const vehiclesApi = {
  list:   ()         => req<any[]>("/api/vehicles"),
  get:    (id: string)         => req<any>(`/api/vehicles/${id}`),
  create: (data: any)          => req<any>("/api/vehicles", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => req<any>(`/api/vehicles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string)         => req<{ ok: boolean }>(`/api/vehicles/${id}`, { method: "DELETE" }),
};

// ── Rentals ──────────────────────────────────────────────────────────────────
export const rentalsApi = {
  list:   ()         => req<any[]>("/api/rentals"),
  get:    (id: string)         => req<any>(`/api/rentals/${id}`),
  create: (data: any)          => req<any>("/api/rentals", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => req<any>(`/api/rentals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string)         => req<{ ok: boolean }>(`/api/rentals/${id}`, { method: "DELETE" }),
};

// ── Reservations ─────────────────────────────────────────────────────────────
export const reservationsApi = {
  list:   ()         => req<any[]>("/api/reservations"),
  get:    (id: string)         => req<any>(`/api/reservations/${id}`),
  create: (data: any)          => req<any>("/api/reservations", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => req<any>(`/api/reservations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string)         => req<{ ok: boolean }>(`/api/reservations/${id}`, { method: "DELETE" }),
};

// ── Expenses ─────────────────────────────────────────────────────────────────
export const expensesApi = {
  list:   ()         => req<any[]>("/api/expenses"),
  create: (data: any)          => req<any>("/api/expenses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => req<any>(`/api/expenses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string)         => req<{ ok: boolean }>(`/api/expenses/${id}`, { method: "DELETE" }),
};

// ── Infractions ───────────────────────────────────────────────────────────────
export const infractionsApi = {
  list:   ()         => req<any[]>("/api/infractions"),
  create: (data: any)          => req<any>("/api/infractions", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => req<any>(`/api/infractions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string)         => req<{ ok: boolean }>(`/api/infractions/${id}`, { method: "DELETE" }),
};

// ── Damages ───────────────────────────────────────────────────────────────────
export const damagesApi = {
  create: (data: any)          => req<any>("/api/damages", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => req<any>(`/api/damages/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string)         => req<{ ok: boolean }>(`/api/damages/${id}`, { method: "DELETE" }),
};
