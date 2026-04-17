/**
 * Converts Prisma DateTime objects → ISO strings
 * so the JSON response matches what the Zustand store expects (string dates).
 */
export function serializeClient(c: any) {
  return {
    ...c,
    licenseExp:   c.licenseExp   ? c.licenseExp.toISOString().slice(0, 10)  : null,
    blacklistedAt: c.blacklistedAt ? c.blacklistedAt.toISOString().slice(0, 10) : null,
    createdAt:    c.createdAt.toISOString().slice(0, 10),
  };
}

export function serializeVehicle(v: any) {
  return {
    ...v,
    technicalInspectionDate: v.technicalInspectionDate ? v.technicalInspectionDate.toISOString().slice(0, 10) : null,
    insuranceExpiry:         v.insuranceExpiry         ? v.insuranceExpiry.toISOString().slice(0, 10)         : null,
    vignetteExpiry:          v.vignetteExpiry          ? v.vignetteExpiry.toISOString().slice(0, 10)          : null,
    createdAt:               v.createdAt.toISOString().slice(0, 10),
    // Attach damageLogs as the `damages` array the frontend expects
    damages: (v.damageLogs ?? []).map(serializeDamage),
  };
}

export function serializeRental(r: any) {
  return {
    ...r,
    startDate:  r.startDate.toISOString().slice(0, 10),
    endDate:    r.endDate.toISOString().slice(0, 10),
    returnDate: r.returnDate ? r.returnDate.toISOString().slice(0, 10) : null,
    createdAt:  r.createdAt.toISOString().slice(0, 10),
    // Parse the JSON extras string back into an array
    extras: r.extras ? JSON.parse(r.extras) : [],
  };
}

export function serializeReservation(r: any) {
  return {
    ...r,
    startDate: r.startDate.toISOString().slice(0, 10),
    endDate:   r.endDate.toISOString().slice(0, 10),
    createdAt: r.createdAt.toISOString().slice(0, 10),
  };
}

export function serializeDamage(d: any) {
  return {
    ...d,
    reportedAt: d.reportedAt instanceof Date ? d.reportedAt.toISOString().slice(0, 10) : d.reportedAt,
    repairedAt: d.repairedAt ? (d.repairedAt instanceof Date ? d.repairedAt.toISOString().slice(0, 10) : d.repairedAt) : null,
  };
}

export function serializeExpense(e: any) {
  return {
    ...e,
    date:      e.date.toISOString().slice(0, 10),
    createdAt: e.createdAt.toISOString().slice(0, 10),
  };
}

export function serializeInfraction(i: any) {
  return {
    ...i,
    date:      i.date.toISOString().slice(0, 10),
    createdAt: i.createdAt.toISOString().slice(0, 10),
  };
}

/** Generate a short unique reference code */
export function makeRefCode(prefix: string, count: number) {
  return `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
}
