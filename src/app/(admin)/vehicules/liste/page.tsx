"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { Plus, Search, AlertTriangle, Car, Gauge, CheckCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";

const STATUS: Record<string,{label:string;color:string}> = {
  AVAILABLE:{label:"Disponible",color:"text-brand-green-400 bg-brand-green-500/10 border-brand-green-500/20"},
  RENTED:{label:"Loué",color:"text-blue-400 bg-blue-500/10 border-blue-500/20"},
  MAINTENANCE:{label:"Maintenance",color:"text-brand-orange-400 bg-brand-orange-500/10 border-brand-orange-500/20"},
  OUT_OF_SERVICE:{label:"Hors service",color:"text-red-400 bg-red-500/10 border-red-500/20"},
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
function Chevron(){return(<svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);}

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
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Flotte de Véhicules</h1>
          <p className="text-slate-500 text-sm mt-0.5">{vehicles.length} véhicules{totalAlerts>0&&<span className="text-brand-orange-400 ml-2">· {totalAlerts} alerte(s)</span>}</p>
        </div>
        <Link href="/vehicules/nouveau"><button className="flex items-center gap-2 px-4 py-2 bg-brand-green-600 hover:bg-brand-green-500 text-white text-sm font-semibold rounded-lg transition-colors"><Plus size={15}/>Ajouter</button></Link>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {([["ALL","Tous",vehicles.length,"text-white"],["AVAILABLE","Disponibles",vehicles.filter(v=>v.status==="AVAILABLE").length,"text-brand-green-400"],["RENTED","Loués",vehicles.filter(v=>v.status==="RENTED").length,"text-blue-400"],["MAINTENANCE","Maintenance",vehicles.filter(v=>v.status==="MAINTENANCE").length,"text-brand-orange-400"]] as const).map(([f,l,v,c])=>(
          <button key={f} onClick={()=>setFilter(f)} className={cn("rounded-xl border bg-[#161b22] p-4 text-left transition-all",filter===f?"border-brand-green-500/40 bg-brand-green-500/5":"border-[#21262d] hover:border-[#30363d]")}>
            <p className="text-xs text-slate-500">{l}</p><p className={cn("text-2xl font-bold mt-1",c)}>{v}</p>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Marque, modèle, plaque, couleur..."
          className="w-full pl-9 pr-4 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-green-500/50 transition-all"/>
      </div>

      <div className="space-y-2">
        {filtered.map(v=>{
          const cfg=STATUS[v.status];const hasCritical=v.alerts.some(a=>a.sev==="CRITICAL");
          return(
            <div key={v.id} className={cn("rounded-xl border bg-[#161b22] p-4 flex items-center gap-3 hover:bg-[#1c2130] transition-all group",hasCritical?"border-red-500/25":"border-[#21262d] hover:border-brand-green-500/25")}>
              <button onClick={()=>router.push(`/vehicules/${v.id}`)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
                <div className="w-12 h-12 rounded-xl bg-[#1c2130] border border-[#21262d] flex items-center justify-center flex-shrink-0"><Car size={22} className="text-slate-500"/></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-bold text-slate-100">{v.brand} {v.model} <span className="text-slate-500 font-normal">{v.year}</span></p>
                    <span className="text-[11px] font-mono text-slate-500 bg-[#0d1117] px-1.5 py-0.5 rounded">{v.plate}</span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",cfg.color)}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1"><Gauge size={11}/>{v.mileage.toLocaleString("fr-MA")} km</span>
                    <span>{v.color} · {v.fuelType}</span>
                    {v.alerts.length===0&&<span className="flex items-center gap-1 text-brand-green-500/60"><CheckCircle size={10}/>RAS</span>}
                    {v.alerts.slice(0,2).map((a,i)=><span key={i} className={cn("flex items-center gap-1 font-semibold",a.sev==="CRITICAL"?"text-red-400":"text-brand-orange-400")}><AlertTriangle size={10}/>{a.msg}</span>)}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block mr-2">
                  <p className="text-base font-bold text-brand-green-400">{v.dailyRate} MAD<span className="text-slate-500 text-xs">/j</span></p>
                  <p className="text-xs text-slate-500">{v.revenue.toLocaleString("fr-MA")} MAD CA</p>
                </div>
                <span className="text-slate-600 group-hover:text-brand-green-400 transition-colors flex-shrink-0"><Chevron/></span>
              </button>
              <button onClick={()=>{setDelId(v.id);setDelError("");}}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0" title="Supprimer">
                <Trash2 size={14}/>
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
