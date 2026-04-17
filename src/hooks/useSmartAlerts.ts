"use client";
import { useStore } from "@/store";

export interface SmartAlert {
  id: string;
  type: "CRITICAL" | "WARNING" | "INFO";
  category: "VEHICLE" | "RENTAL" | "PAYMENT" | "DOCUMENT" | "CLIENT";
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  vehicleId?: string;
  rentalId?: string;
  clientId?: string;
}

export function useSmartAlerts(): SmartAlert[] {
  const { vehicles, rentals, clients, infractions } = useStore();
  const alerts: SmartAlert[] = [];
  const now = Date.now();
  const day = 86400000;

  // 1. Vehicle document alerts
  vehicles.forEach((v) => {
    const oilLeft = v.nextOilChangeMileage - v.mileage;
    if (oilLeft <= 0) alerts.push({ id: `oil-${v.id}`, type: "CRITICAL", category: "VEHICLE", title: `Vidange dépassée — ${v.plate}`, description: `${v.brand} ${v.model} dépasse de ${Math.abs(oilLeft).toLocaleString("fr-FR")} km`, actionLabel: "Voir véhicule", actionHref: `/vehicules/${v.id}`, vehicleId: v.id });
    else if (oilLeft <= 1500) alerts.push({ id: `oil-warn-${v.id}`, type: "WARNING", category: "VEHICLE", title: `Vidange imminente — ${v.plate}`, description: `${v.brand} ${v.model}: dans ${oilLeft.toLocaleString("fr-FR")} km`, actionLabel: "Voir véhicule", actionHref: `/vehicules/${v.id}`, vehicleId: v.id });

    if (v.technicalInspectionDate) {
      const d = Math.ceil((new Date(v.technicalInspectionDate).getTime() - now) / day);
      if (d < 0) alerts.push({ id: `tech-${v.id}`, type: "CRITICAL", category: "DOCUMENT", title: `Visite technique expirée — ${v.plate}`, description: `Expirée depuis ${Math.abs(d)} jours. À renouveler immédiatement.`, actionLabel: "Voir véhicule", actionHref: `/vehicules/${v.id}`, vehicleId: v.id });
      else if (d <= 30) alerts.push({ id: `tech-warn-${v.id}`, type: "WARNING", category: "DOCUMENT", title: `Visite technique — ${v.plate}`, description: `Expire dans ${d} jours.`, actionLabel: "Voir véhicule", actionHref: `/vehicules/${v.id}`, vehicleId: v.id });
    }
    if (v.insuranceExpiry) {
      const d = Math.ceil((new Date(v.insuranceExpiry).getTime() - now) / day);
      if (d < 0) alerts.push({ id: `ins-${v.id}`, type: "CRITICAL", category: "DOCUMENT", title: `Assurance expirée — ${v.plate}`, description: `Expirée depuis ${Math.abs(d)} jours!`, actionLabel: "Voir véhicule", actionHref: `/vehicules/${v.id}`, vehicleId: v.id });
      else if (d <= 30) alerts.push({ id: `ins-warn-${v.id}`, type: "WARNING", category: "DOCUMENT", title: `Assurance bientôt expirée — ${v.plate}`, description: `Expire dans ${d} jours.`, actionLabel: "Voir véhicule", actionHref: `/vehicules/${v.id}`, vehicleId: v.id });
    }
    if (v.vignetteExpiry) {
      const d = Math.ceil((new Date(v.vignetteExpiry).getTime() - now) / day);
      if (d < 0) alerts.push({ id: `vig-${v.id}`, type: "CRITICAL", category: "DOCUMENT", title: `Vignette expirée — ${v.plate}`, description: `Expirée depuis ${Math.abs(d)} jours!`, actionLabel: "Voir véhicule", actionHref: `/vehicules/${v.id}`, vehicleId: v.id });
      else if (d <= 15) alerts.push({ id: `vig-warn-${v.id}`, type: "WARNING", category: "DOCUMENT", title: `Vignette — ${v.plate}`, description: `Expire dans ${d} jours.`, actionLabel: "Voir véhicule", actionHref: `/vehicules/${v.id}`, vehicleId: v.id });
    }
  });

  // 2. Overdue rentals
  rentals.filter((r) => r.status === "ACTIVE").forEach((r) => {
    const daysLate = Math.ceil((now - new Date(r.endDate).getTime()) / day);
    if (daysLate > 0) {
      const client = clients.find((c) => c.id === r.clientId);
      alerts.push({ id: `late-${r.id}`, type: "CRITICAL", category: "RENTAL", title: `Retour en retard — ${r.contractNum}`, description: `${client?.firstName} ${client?.lastName} devait rendre le véhicule il y a ${daysLate} jour(s).`, actionLabel: "Voir contrat", actionHref: `/locations/${r.id}`, rentalId: r.id, clientId: r.clientId });
    }
  });

  // 3. Unpaid balances
  rentals.forEach((r) => {
    const due = r.totalAmount - r.paidAmount;
    if (due > 0 && r.status === "COMPLETED") {
      const client = clients.find((c) => c.id === r.clientId);
      alerts.push({ id: `pay-${r.id}`, type: "WARNING", category: "PAYMENT", title: `Solde impayé — ${r.contractNum}`, description: `${client?.firstName} ${client?.lastName}: ${due.toLocaleString("fr-FR")} MAD dû.`, actionLabel: "Voir contrat", actionHref: `/locations/${r.id}`, rentalId: r.id, clientId: r.clientId });
    }
  });

  // 4. Unresolved infractions
  const unresolved = infractions.filter((i) => !i.resolved);
  if (unresolved.length > 0) {
    alerts.push({ id: "infractions", type: "INFO", category: "CLIENT", title: `${unresolved.length} infraction(s) non résolue(s)`, description: `Montant total en attente: ${unresolved.reduce((s, i) => s + (i.amount ?? 0), 0).toLocaleString("fr-FR")} MAD`, actionLabel: "Gérer", actionHref: "/moderation/infractions" });
  }

  // 5. Expiring client licenses
  clients.forEach((c) => {
    if (c.licenseExp) {
      const d = Math.ceil((new Date(c.licenseExp).getTime() - now) / day);
      if (d < 0 && !c.isBlacklist) alerts.push({ id: `lic-${c.id}`, type: "WARNING", category: "CLIENT", title: `Permis expiré — ${c.firstName} ${c.lastName}`, description: `Permis expiré depuis ${Math.abs(d)} jours. À vérifier avant prochaine location.`, actionLabel: "Voir client", actionHref: `/clients/${c.id}`, clientId: c.id });
      else if (d <= 30 && d > 0) alerts.push({ id: `lic-warn-${c.id}`, type: "INFO", category: "CLIENT", title: `Permis bientôt expiré — ${c.firstName} ${c.lastName}`, description: `Expire dans ${d} jours.`, actionLabel: "Voir client", actionHref: `/clients/${c.id}`, clientId: c.id });
    }
  });

  // Sort: CRITICAL first
  return alerts.sort((a, b) => {
    const order = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    return order[a.type] - order[b.type];
  });
}
