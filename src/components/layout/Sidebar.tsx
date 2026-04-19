"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldBan, PlusCircle, Car, Wallet, BarChart3, AlertTriangle, ChevronLeft, ChevronRight, Gauge, List, CreditCard, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth";

interface SidebarProps { collapsed: boolean; onToggle: () => void; }

const NAV = [
  { title: "Clients", items: [
    { label: "Liste des clients",  href: "/clients/liste",          icon: <List size={14} /> },
    { label: "Liste noire",        href: "/clients/liste-noire",    icon: <ShieldBan size={14} /> },
  ]},
  { title: "Réservations", items: [
    { label: "Liste",              href: "/reservations/liste",     icon: <List size={14} /> },
    { label: "Nouvelle",           href: "/reservations/nouveau",   icon: <PlusCircle size={14} /> },
  ]},
  { title: "Locations", items: [
    { label: "Liste",              href: "/locations/liste",        icon: <List size={14} /> },
    { label: "Nouvelle location",  href: "/locations/nouveau",      icon: <PlusCircle size={14} /> },
  ]},
  { title: "Véhicules", items: [
    { label: "Flotte",             href: "/vehicules/liste",        icon: <Car size={14} /> },
    { label: "Ajouter véhicule",   href: "/vehicules/nouveau",      icon: <PlusCircle size={14} /> },
  ]},
  { title: "Comptabilité", items: [
    { label: "Revenus",            href: "/comptabilite/revenus",   icon: <Wallet size={14} /> },
    { label: "Charges & Dépenses", href: "/comptabilite/charges",   icon: <CreditCard size={14} /> },
    { label: "Statistiques",       href: "/dashboard/statistiques", icon: <BarChart3 size={14} /> },
  ]},
  { title: "Modération", items: [
    { label: "Infractions",        href: "/moderation/infractions", icon: <AlertTriangle size={14} /> },
  ]},
  { title: "Configuration", items: [
    { label: "Paramètres",         href: "/parametres",             icon: <Settings size={14} /> },
  ]},
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // CORRECTION : On utilise bien 'username' ici, correspondant au store.
  const { username, logout } = useAuth();

  const handleLogout = () => { logout(); router.push("/login"); };

  return (
    <aside className={cn("flex flex-col h-full border-r border-[#21262d] bg-[#0d1117] transition-all duration-300 ease-in-out z-30 flex-shrink-0", collapsed ? "w-[60px]" : "w-[240px]")}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#21262d] h-[60px]">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="Rentify-OSLogo" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">Rentify-OS</p>
                <p className="text-[10px] text-brand-green-500/70 leading-none mt-0.5"> · Admin</p>
              </div>
            </div>
            <button onClick={onToggle} className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded">
              <ChevronLeft size={15} />
            </button>
          </>
        ) : (
          <div className="w-8 h-8 flex items-center justify-center mx-auto">
            <img src="/logo.png" alt="Rentify-OSLogo" className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      {/* Dashboard shortcut */}
      <div className="px-3 pt-3">
        <Link href="/dashboard/statistiques">
          <div className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all cursor-pointer", pathname === "/dashboard/statistiques" ? "bg-brand-green-500/10 text-brand-green-400 border border-brand-green-500/20" : "text-slate-400 hover:text-white hover:bg-[#161b22]")}>
            <Gauge size={15} className="flex-shrink-0" />
            {!collapsed && <span className="font-medium text-[13px]">Dashboard</span>}
          </div>
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 mt-3 space-y-4">
        {NAV.map((section) => (
          <div key={section.title}>
            {!collapsed ? (
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-1.5">{section.title}</p>
            ) : (
              <div className="border-t border-[#21262d] my-2" />
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <div title={collapsed ? item.label : undefined}
                        className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-all cursor-pointer group", isActive ? "bg-brand-green-500/10 text-brand-green-400 border border-brand-green-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-[#161b22]")}>
                        <span className={cn("flex-shrink-0", isActive ? "text-brand-green-400" : "text-slate-500 group-hover:text-slate-300")}>{item.icon}</span>
                        {!collapsed && <span className={cn("truncate", isActive ? "font-semibold" : "")}>{item.label}</span>}
                        {!collapsed && isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-green-400 flex-shrink-0" />}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Expand when collapsed */}
      {collapsed && (
        <div className="p-3 border-t border-[#21262d]">
          <button onClick={onToggle} className="w-full flex items-center justify-center py-2 text-slate-500 hover:text-slate-300">
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* User Section */}
      {!collapsed && (
        <div className="p-3 border-t border-[#21262d]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#161b22]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-orange-400 to-brand-orange-600 flex items-center justify-center flex-shrink-0">
              {/* CORRECTION : Utilisation de 'username' */}
              <span className="text-[11px] font-bold text-white">{username ? username[0].toUpperCase() : "A"}</span>
            </div>
            <div className="flex-1 min-w-0">
              {/* CORRECTION : Utilisation de 'username' */}
              <p className="text-xs font-semibold text-slate-200 truncate capitalize">{username ?? "Admin"}</p>
              <p className="text-[10px] text-slate-500">Administrateur</p>
            </div>
            <button onClick={handleLogout} title="Déconnexion" className="text-slate-500 hover:text-red-400 transition-colors p-1">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}