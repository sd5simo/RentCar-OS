"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Car, CheckCircle } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export default function AvailabilityCalendar() {
  const router = useRouter();
  const { vehicles, rentals } = useStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const getRentalsOnDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return rentals.filter((r) => r.status === "ACTIVE" && r.startDate <= dateStr && r.endDate >= dateStr);
  };

  const getAvailableVehicles = (day: number) => {
    const activeRentalIds = new Set(getRentalsOnDay(day).map((r) => r.vehicleId));
    return vehicles.filter((v) => v.status === "AVAILABLE" || (v.status === "RENTED" && !activeRentalIds.has(v.id)));
  };

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const selectedDayNum = selectedDate ? parseInt(selectedDate.split("-")[2]) : null;
  const selectedAvailable = selectedDayNum ? getAvailableVehicles(selectedDayNum) : [];
  const selectedBusy = selectedDayNum ? getRentalsOnDay(selectedDayNum) : [];

  return (
    <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-slate-200">Calendrier de disponibilité</p>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 hover:bg-[#1c2130] transition-colors"><ChevronLeft size={14} /></button>
          <span className="text-sm font-semibold text-slate-300 min-w-[130px] text-center">{MONTHS_FR[month]} {year}</span>
          <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 hover:bg-[#1c2130] transition-colors"><ChevronRight size={14} /></button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-600 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const rentedCount = getRentalsOnDay(day).length;
          const availCount = getAvailableVehicles(day).length;
          const isToday = dateStr === now.toISOString().slice(0, 10);
          const isPast = new Date(dateStr) < new Date(now.toISOString().slice(0, 10));
          const isSelected = selectedDate === dateStr;

          return (
            <button key={day} onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={cn("relative h-10 rounded-md flex flex-col items-center justify-center text-xs transition-all",
                isSelected ? "bg-brand-green-500/20 border border-brand-green-500/40" :
                isToday ? "bg-blue-500/15 border border-blue-500/30" :
                isPast ? "opacity-40 hover:opacity-60" : "hover:bg-[#1c2130]")}>
              <span className={cn("font-semibold leading-none", isSelected ? "text-brand-green-400" : isToday ? "text-blue-400" : "text-slate-300")}>{day}</span>
              {rentedCount > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: Math.min(rentedCount, 4) }).map((_, j) => (
                    <span key={j} className="w-1 h-1 rounded-full bg-brand-orange-400" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#21262d] text-[10px] text-slate-600">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-orange-400" /> Véhicule loué</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Aujourd'hui</span>
      </div>

      {/* Selected day detail */}
      {selectedDate && selectedDayNum && (
        <div className="mt-4 pt-4 border-t border-[#21262d] space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            {new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" })}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#0d1117] border border-[#21262d] p-3">
              <p className="text-[10px] text-brand-green-400 font-bold uppercase mb-2">Disponibles ({selectedAvailable.length})</p>
              {selectedAvailable.length === 0 ? <p className="text-xs text-slate-600">Aucun véhicule</p> :
                selectedAvailable.slice(0, 4).map((v) => (
                  <button key={v.id} onClick={() => router.push(`/vehicules/${v.id}`)}
                    className="flex items-center gap-2 py-1 text-xs text-slate-400 hover:text-brand-green-400 transition-colors w-full text-left">
                    <CheckCircle size={10} className="text-brand-green-500/50" />
                    <span className="font-mono">{v.plate}</span>
                    <span className="text-slate-600">{v.brand} {v.model}</span>
                  </button>
                ))}
            </div>
            <div className="rounded-lg bg-[#0d1117] border border-[#21262d] p-3">
              <p className="text-[10px] text-brand-orange-400 font-bold uppercase mb-2">Loués ({selectedBusy.length})</p>
              {selectedBusy.length === 0 ? <p className="text-xs text-slate-600">Aucun</p> :
                selectedBusy.map((r) => {
                  const v = vehicles.find(x => x.id === r.vehicleId);
                  return (
                    <button key={r.id} onClick={() => router.push(`/locations/${r.id}`)}
                      className="flex items-center gap-2 py-1 text-xs text-slate-400 hover:text-brand-orange-400 transition-colors w-full text-left">
                      <Car size={10} className="text-brand-orange-400/50" />
                      <span className="font-mono">{v?.plate}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
