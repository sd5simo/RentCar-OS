import { useMemo } from "react";
import { Vehicle, VehicleAlert } from "@/types";
import {
  OIL_CHANGE_WARNING_MILEAGE,
  INSPECTION_WARNING_DAYS,
  INSURANCE_WARNING_DAYS,
  VIGNETTE_WARNING_DAYS,
} from "@/lib/constants";

export function useVehicleAlerts(vehicle: Vehicle): VehicleAlert[] {
  return useMemo(() => {
    const alerts: VehicleAlert[] = [];
    const now = new Date();
    const dayMs = 1000 * 60 * 60 * 24;

    // Oil change alert
    const oilRemaining = vehicle.nextOilChangeMileage - vehicle.mileage;
    if (oilRemaining <= 0) {
      alerts.push({
        vehicleId: vehicle.id,
        type: "OIL_CHANGE",
        severity: "CRITICAL",
        message: `Vidange dépassée de ${Math.abs(oilRemaining).toLocaleString("fr-FR")} km!`,
        dueMileage: vehicle.nextOilChangeMileage,
      });
    } else if (oilRemaining <= OIL_CHANGE_WARNING_MILEAGE) {
      alerts.push({
        vehicleId: vehicle.id,
        type: "OIL_CHANGE",
        severity: "WARNING",
        message: `Vidange dans ${oilRemaining.toLocaleString("fr-FR")} km`,
        dueMileage: vehicle.nextOilChangeMileage,
      });
    }

    // Technical inspection
    if (vehicle.technicalInspectionDate) {
      const daysLeft = Math.ceil(
        (new Date(vehicle.technicalInspectionDate).getTime() - now.getTime()) / dayMs
      );
      if (daysLeft < 0) {
        alerts.push({
          vehicleId: vehicle.id,
          type: "TECHNICAL_INSPECTION",
          severity: "CRITICAL",
          message: `Visite technique expirée depuis ${Math.abs(daysLeft)}j!`,
          dueDate: new Date(vehicle.technicalInspectionDate),
        });
      } else if (daysLeft <= INSPECTION_WARNING_DAYS) {
        alerts.push({
          vehicleId: vehicle.id,
          type: "TECHNICAL_INSPECTION",
          severity: "WARNING",
          message: `Visite technique dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`,
          dueDate: new Date(vehicle.technicalInspectionDate),
        });
      }
    }

    // Insurance expiry
    if (vehicle.insuranceExpiry) {
      const daysLeft = Math.ceil(
        (new Date(vehicle.insuranceExpiry).getTime() - now.getTime()) / dayMs
      );
      if (daysLeft < 0) {
        alerts.push({
          vehicleId: vehicle.id,
          type: "INSURANCE",
          severity: "CRITICAL",
          message: `Assurance expirée depuis ${Math.abs(daysLeft)}j!`,
          dueDate: new Date(vehicle.insuranceExpiry),
        });
      } else if (daysLeft <= INSURANCE_WARNING_DAYS) {
        alerts.push({
          vehicleId: vehicle.id,
          type: "INSURANCE",
          severity: "WARNING",
          message: `Assurance expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`,
          dueDate: new Date(vehicle.insuranceExpiry),
        });
      }
    }

    // Vignette expiry
    if (vehicle.vignetteExpiry) {
      const daysLeft = Math.ceil(
        (new Date(vehicle.vignetteExpiry).getTime() - now.getTime()) / dayMs
      );
      if (daysLeft < 0) {
        alerts.push({
          vehicleId: vehicle.id,
          type: "VIGNETTE",
          severity: "CRITICAL",
          message: `Vignette expirée depuis ${Math.abs(daysLeft)}j!`,
          dueDate: new Date(vehicle.vignetteExpiry),
        });
      } else if (daysLeft <= VIGNETTE_WARNING_DAYS) {
        alerts.push({
          vehicleId: vehicle.id,
          type: "VIGNETTE",
          severity: "WARNING",
          message: `Vignette expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`,
          dueDate: new Date(vehicle.vignetteExpiry),
        });
      }
    }

    // Sort: CRITICAL first
    return alerts.sort((a, b) =>
      a.severity === "CRITICAL" && b.severity !== "CRITICAL" ? -1 : 1
    );
  }, [vehicle]);
}
