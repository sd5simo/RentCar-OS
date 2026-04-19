"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { Plus, Search, AlertTriangle, Car, Gauge, CheckCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";

const STATUS: Record<string,{label:string;color:string}> = {
  AVAILABLE:{label:"Disponible",color:"text-brand-green-400 bg-brand-green-500/10 border-brand-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.15)]"},
  RENTED:{label:"Loué",color:"text-blue-400 bg-blue-500/10 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]"},
  MAINTENANCE:{label:"Maintenance",color:"text-brand-orange-400 bg-brand-orange-500/10 border-brand-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.15)]"},
  OUT_OF_SERVICE:{label:"Hors service",color:"text-red-400 bg-red-500/10 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.15)]"},
};

function getAlerts(v:any){
  const a:{sev:"CRITICAL"|"WARNING";msg:string}[]=[];const now=Date.now();const day=86400000;
  const left=v.nextOilChangeMileage-v.mileage;
  if(left<=0)a.push({sev:"CRITICAL",msg:`Vidange dépassée (${Math.abs(left)} km)`});
  else if(left<=2000)a.push({sev:"WARNING",msg:`Vidange dans ${left} km`});
  if(v.technicalInspectionDate){const d=Math.ceil((new Date(v.technicalInspectionDate).getTime()-now)/day);if(d<0)a.push({sev:"CRITICAL",msg:"Visite expirée"});else if(d<=30)a.push({sev:"WARNING",msg:`Visite dans ${d}j`});}
  if(v.insuranceExpiry){const d=Math.ceil((new Date(v.insuranceExpiry).getTime()-now)/day);if(d<0)a.push({sev:"CRITICAL",msg:"Assurance expirée"});else if(d<=30)a.push({sev:"WARNING",msg:`Assurance dans ${d}j`});}
  if(v.vignetteExpiry){const d=Math.ceil((new Date(v.vignetteExpiry).getTime()-now)/day);if(d<0)a.push({sev:"CRITICAL",msg:"Vignette expirée"});else if(d<=30)a.push({sev:"WARNING",msg:`Vignette dans ${d}j`});}
  return a;
}

function Chevron(){return(<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);}

export default function VehiculesListePage(){
  const router=useRouter();
  const{vehicles,getVehicleTotalRevenue,deleteVehicle}=useStore();
  const[search,setSearch]=useState("");
  const[filter,setFilter]=useState("ALL");
  const[delId,setDelId]=useState<string|null>(null);
  const[deleting,setDeleting]=useState(false);
  const[delError,setDelError]=useState("");

  const enriched=vehicles.map(v=>({...v,alerts:getAlerts(v),revenue:getVehicleTotalRevenue(v.id)}));
  const filtered=enriched.filter(v=>{
    const q=`${v.brand} ${v.model} ${v.plate} ${v.color}`.toLowerCase();
    return q.includes(search.toLowerCase())&&(filter==="ALL"||v.status===filter);
  });
  const totalAlerts=enriched.reduce((s,v)=>s+v.alerts.length,0);

  const confirmDelete=async()=>{
    if(!delId)return;
    setDeleting(true);setDelError("");
    try{await deleteVehicle(delId);setDelId(null);}
    catch(e:any){setDelError(e.message);}
    finally{setDeleting(false);}
  };
  const delTarget=delId?enriched.find(v=>v.id===delId):null;

  return(
    <div className="space-y-6 animate-fade-in relative z-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Flotte de Véhicules</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">
            {vehicles.length} véhicules gérés
            {totalAlerts>0&&<span className="text-brand-orange-400 ml-2 font-bold bg-brand-orange-500/10 px-2 py-0.5 rounded-full border border-brand-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.2)]">· {totalAlerts} alerte(s)</span>}
          </p>
        </div>
        <Link href="/vehicules/nouveau">
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-green-500/20 hover:bg-brand-green-500/30 border border-brand-green-500/30 text-brand-green-400 text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.25)]">
            <Plus size={16}/>Ajouter
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([["ALL","Tous",vehicles.length,"text-white"],["AVAILABLE","Disponibles",vehicles.filter(v=>v.status==="AVAILABLE").length,"text-brand-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"],["RENTED","Loués",vehicles.filter(v=>v.status==="RENTED").length,"text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"],["MAINTENANCE","Maintenance",vehicles.filter(v=>v.status==="MAINTENANCE").length,"text-brand-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]"]] as const).map(([f,l,v,c])=>(
          <button key={f} onClick={()=>setFilter(f)} className={cn("glass-panel glass-panel-hover rounded-2xl p-5 text-left group",filter===f?"border-brand-green-500/30 bg-brand-green-500/10 shadow-[0_8px_32px_rgba(34,197,94,0.15)]":"")}>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{l}</p>
            <p className={cn("text-3xl font-black mt-2 transition-transform origin-left group-hover:scale-105",c)}>{v}</p>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher par marque, modèle, plaque..."
          className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:bg-white/[0.05] focus:border-brand-green-500/50 focus:shadow-[0_0_15px_rgba(34,197,94,0.15)] backdrop-blur-md transition-all"/>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <div className="glass-panel text-center py-12 text-slate-400 rounded-2xl font-medium">Aucun véhicule ne correspond à vos critères.</div>}
        {filtered.map(v=>{
          const cfg=STATUS[v.status];const hasCritical=v.alerts.some(a=>a.sev==="CRITICAL");
          return(
            <div key={v.id} className={cn("glass-panel glass-panel-hover rounded-2xl p-4 flex items-center gap-4 group",hasCritical?"border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-red-500/5":"")}>
              <button onClick={()=>router.push(`/vehicules/${v.id}`)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
                <div className="w-12 h-12 rounded-xl glass-item flex items-center justify-center flex-shrink-0 shadow-sm"><Car size={20} className="text-slate-300 group-hover:text-white transition-colors"/></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <p className="text-base font-bold text-white">{v.brand} {v.model} <span className="text-slate-400 font-medium ml-1">{v.year}</span></p>
                    <span className="text-xs font-mono font-bold text-slate-300 bg-white/10 border border-white/10 px-2 py-0.5 rounded-md shadow-sm">{v.plate}</span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",cfg.color)}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap font-medium">
                    <span className="flex items-center gap-1.5"><Gauge size={12} className="text-slate-500"/>{v.mileage.toLocaleString("fr-MA")} km</span>
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-white/20" style={{backgroundColor: v.color.toLowerCase()}}/>{v.color} · {v.fuelType}</span>
                    {v.alerts.length===0&&<span className="flex items-center gap-1.5 text-brand-green-400"><CheckCircle size={12}/>RAS</span>}
                    {v.alerts.slice(0,2).map((a,i)=><span key={i} className={cn("flex items-center gap-1.5 font-bold",a.sev==="CRITICAL"?"text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]":"text-brand-orange-400")}><AlertTriangle size={12}/>{a.msg}</span>)}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block mr-3">
                  <p className="text-base font-black text-brand-green-400 drop-shadow-sm">{v.dailyRate} MAD<span className="text-slate-400 text-xs font-semibold">/j</span></p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{v.revenue.toLocaleString("fr-MA")} MAD CA</p>
                </div>
                <span className="text-slate-500 group-hover:text-brand-green-400 transition-colors flex-shrink-0"><Chevron/></span>
              </button>
              <button onClick={()=>{setDelId(v.id);setDelError("");}}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all flex-shrink-0 shadow-sm" title="Supprimer">
                <Trash2 size={16}/>
              </button>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={!!delId}
        title={delTarget?`Supprimer ${delTarget.brand} ${delTarget.model} (${delTarget.plate}) ?`:""}
        description={delError||"Toutes les données liées à ce véhicule seront supprimées. Action irréversible."}
        confirmLabel="Supprimer définitivement"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={()=>{setDelId(null);setDelError("");}}
      />
    </div>
  );
}