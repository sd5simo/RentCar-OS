export interface Client {
  id: string;
  cin: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  city?: string | null;
  licenseNum?: string | null;
  licenseExp?: Date | null;
  isBlacklist: boolean;
  blacklistReason?: string | null;
  blacklistedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  category: VehicleCategory;
  color: string;
  fuelType: FuelType;
  transmission: Transmission;
  seats: number;
  dailyRate: number;
  status: VehicleStatus;
  mileage: number;
  lastOilChangeMileage: number;
  nextOilChangeMileage: number;
  technicalInspectionDate?: Date | null;
  insuranceExpiry?: Date | null;
  vignetteExpiry?: Date | null;
  notes?: string | null;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rental {
  id: string;
  contractNum: string;
  clientId: string;
  vehicleId: string;
  reservationId?: string | null;
  startDate: Date;
  endDate: Date;
  returnDate?: Date | null;
  dailyRate: number;
  totalDays: number;
  totalAmount: number;
  deposit: number;
  depositReturned: boolean;
  fuelLevelStart: string;
  fuelLevelEnd?: string | null;
  mileageStart: number;
  mileageEnd?: number | null;
  status: RentalStatus;
  contractPdfUrl?: string | null;
  notes?: string | null;
  extras?: string | null;
  createdAt: Date;
  updatedAt: Date;
  client?: Client;
  vehicle?: Vehicle;
}

export interface Reservation {
  id: string;
  refCode: string;
  clientId: string;
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  status: ReservationStatus;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  client?: Client;
  vehicle?: Vehicle;
}

export interface Expense {
  id: string;
  vehicleId?: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date;
  vendor?: string | null;
  receipt?: string | null;
  createdAt: Date;
  updatedAt: Date;
  vehicle?: Vehicle;
}

export interface DamageLog {
  id: string;
  vehicleId: string;
  description: string;
  severity: DamageSeverity;
  zone: DamageZone;
  repaired: boolean;
  repairCost?: number | null;
  detectedAt: Date;
  repairedAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
}

export interface Infraction {
  id: string;
  clientId: string;
  type: InfractionType;
  description: string;
  amount?: number | null;
  date: Date;
  resolved: boolean;
  createdAt: Date;
  client?: Client;
}

export interface MonthlyStats {
  month: string;
  monthNum: number;
  year: number;
  revenue: number;
  expenses: number;
  net: number;
  rentalCount: number;
}

// Enums
export type VehicleCategory = "ECONOMY" | "COMFORT" | "LUXURY" | "SUV" | "VAN";
export type VehicleStatus =
  | "AVAILABLE"
  | "RENTED"
  | "MAINTENANCE"
  | "OUT_OF_SERVICE";
export type FuelType = "DIESEL" | "ESSENCE" | "HYBRID" | "ELECTRIC";
export type Transmission = "MANUAL" | "AUTOMATIC";
export type RentalStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "CONVERTED";
export type ExpenseCategory =
  | "MAINTENANCE"
  | "FUEL"
  | "INSURANCE"
  | "CLEANING"
  | "REPAIR"
  | "OTHER";
export type DamageSeverity = "MINOR" | "MODERATE" | "SEVERE";
export type DamageZone =
  | "FRONT"
  | "REAR"
  | "LEFT"
  | "RIGHT"
  | "TOP"
  | "INTERIOR";
export type InfractionType =
  | "SPEEDING"
  | "PARKING"
  | "DAMAGE"
  | "LATE_RETURN"
  | "OTHER";

export interface VehicleAlert {
  vehicleId: string;
  type: "OIL_CHANGE" | "TECHNICAL_INSPECTION" | "INSURANCE" | "VIGNETTE";
  severity: "WARNING" | "CRITICAL";
  message: string;
  dueDate?: Date;
  dueMileage?: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}
