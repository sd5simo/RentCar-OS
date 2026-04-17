import { useMemo } from "react";
import { MonthlyStats } from "@/types";
import { DEMO_MONTHLY_STATS } from "@/lib/constants";

export function useFinancialStats() {
  return useMemo(() => {
    const stats: MonthlyStats[] = DEMO_MONTHLY_STATS.map((m) => ({
      ...m,
      net: m.revenue - m.expenses,
    }));

    const totalRevenue = stats.reduce((s, m) => s + m.revenue, 0);
    const totalExpenses = stats.reduce((s, m) => s + m.expenses, 0);
    const totalNet = totalRevenue - totalExpenses;
    const totalRentals = stats.reduce((s, m) => s + m.rentalCount, 0);
    const netMargin = totalRevenue > 0 ? (totalNet / totalRevenue) * 100 : 0;

    const bestMonth = stats.reduce((a, b) => (a.net > b.net ? a : b));
    const worstMonth = stats.reduce((a, b) => (a.net < b.net ? a : b));

    const currentMonth = stats[stats.length - 1];
    const prevMonth = stats[stats.length - 2];
    const revenueGrowth =
      prevMonth && prevMonth.revenue > 0
        ? ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
        : 0;

    return {
      stats,
      totalRevenue,
      totalExpenses,
      totalNet,
      totalRentals,
      netMargin,
      bestMonth,
      worstMonth,
      currentMonth,
      revenueGrowth,
    };
  }, []);
}
