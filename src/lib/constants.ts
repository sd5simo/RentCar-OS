export const AGENCY_NAME = "Rentify-OS";
export const AGENCY_FULL = "Rentify-OSLocation de Voitures";
export const AGENCY_ADDRESS = "123 Avenue Mohammed V, Casablanca 20000";
export const AGENCY_PHONE = "+212 522 123 456";
export const AGENCY_EMAIL = "contact@Rentify-OS.ma";
export const AGENCY_ICE = "002345678000012";
export const AGENCY_RC = "123456";

// Alert thresholds
export const OIL_CHANGE_WARNING_MILEAGE = 1500; // km before due
export const INSPECTION_WARNING_DAYS = 30;
export const INSURANCE_WARNING_DAYS = 30;
export const VIGNETTE_WARNING_DAYS = 30;

// Monthly names
export const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

// Fuel levels
export const FUEL_LEVELS = [
  { value: "EMPTY", label: "Vide", icon: "□" },
  { value: "QUARTER", label: "1/4", icon: "▢" },
  { value: "HALF", label: "1/2", icon: "▤" },
  { value: "THREE_QUARTER", label: "3/4", icon: "▦" },
  { value: "FULL", label: "Plein", icon: "■" },
];

// Vehicle categories with labels
export const VEHICLE_CATEGORIES = [
  { value: "ECONOMY", label: "Économique", color: "text-blue-400" },
  { value: "COMFORT", label: "Confort", color: "text-purple-400" },
  { value: "LUXURY", label: "Luxe", color: "text-yellow-400" },
  { value: "SUV", label: "SUV", color: "text-brand-green-400" },
  { value: "VAN", label: "Van", color: "text-brand-orange-400" },
];

// Payment methods
export const PAYMENT_METHODS = [
  { value: "CASH", label: "Espèces" },
  { value: "CARD", label: "Carte bancaire" },
  { value: "TRANSFER", label: "Virement" },
  { value: "CHEQUE", label: "Chèque" },
];

// Stats data for the dashboard (realistic demo data)
export const DEMO_MONTHLY_STATS = [
  { month: "Janvier", monthNum: 1, year: 2024, revenue: 285000, expenses: 62000, rentalCount: 42 },
  { month: "Février", monthNum: 2, year: 2024, revenue: 312000, expenses: 58000, rentalCount: 47 },
  { month: "Mars", monthNum: 3, year: 2024, revenue: 298000, expenses: 71000, rentalCount: 44 },
  { month: "Avril", monthNum: 4, year: 2024, revenue: 341000, expenses: 65000, rentalCount: 52 },
  { month: "Mai", monthNum: 5, year: 2024, revenue: 367000, expenses: 69000, rentalCount: 56 },
  { month: "Juin", monthNum: 6, year: 2024, revenue: 425000, expenses: 82000, rentalCount: 64 },
  { month: "Juillet", monthNum: 7, year: 2024, revenue: 512000, expenses: 95000, rentalCount: 78 },
  { month: "Août", monthNum: 8, year: 2024, revenue: 489000, expenses: 88000, rentalCount: 74 },
  { month: "Septembre", monthNum: 9, year: 2024, revenue: 398000, expenses: 74000, rentalCount: 61 },
  { month: "Octobre", monthNum: 10, year: 2024, revenue: 356000, expenses: 67000, rentalCount: 54 },
  { month: "Novembre", monthNum: 11, year: 2024, revenue: 332000, expenses: 61000, rentalCount: 49 },
  { month: "Décembre", monthNum: 12, year: 2024, revenue: 376000, expenses: 72000, rentalCount: 57 },
];
