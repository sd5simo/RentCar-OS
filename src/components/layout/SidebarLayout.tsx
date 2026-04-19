"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#050505] relative z-0">
      {/* 🔴 Arrière-plan lumineux pour l'effet Glassmorphism */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-green-500/20 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute top-[40%] left-[50%] w-[35vw] h-[35vw] rounded-full bg-brand-orange-500/10 blur-[120px]" />
      </div>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex flex-col flex-1 overflow-hidden z-10">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}