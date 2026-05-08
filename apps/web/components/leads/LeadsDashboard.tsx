import React, { useState, useMemo } from "react";
import { LeadCard } from "@/components/leads/LeadCard";
import type { Lead, LeadStatus } from "@/lib/types/lead";
import { Search, Filter, Users, Sparkles, TrendingUp, CheckCircle, ArrowRight, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import type { SchoolActivePlan } from "@/lib/services/services/subscriptions.service";

export function LeadsDashboard({ 
  leads, 
  activePlans = [] 
}: { 
  leads: Lead[], 
  activePlans?: SchoolActivePlan[] 
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const nameMatch = lead.userName?.toLowerCase().includes(search.toLowerCase());
      const statusMatch = statusFilter === "ALL" || lead.status === statusFilter;
      return nameMatch && statusMatch;
    });
  }, [leads, search, statusFilter]);

  const stats = useMemo(() => {
    const total = leads.length;
    const converted = leads.filter(l => l.status === "INSCRITO").length;
    const rate = total > 0 ? (converted / total) * 100 : 0;
    
    return {
      total,
      new: leads.filter(l => l.status === "NUEVO").length,
      interested: leads.filter(l => l.status === "INTERESADO").length,
      converted,
      rate: rate.toFixed(1)
    };
  }, [leads]);

  const statusTabs: { value: LeadStatus | "ALL"; label: string }[] = [
    { value: "ALL", label: "Todo el Embudo" },
    { value: "NUEVO", label: "Recientes" },
    { value: "INTERESADO", label: "En Seguimiento" },
    { value: "VISITA", label: "Citas" },
    { value: "INSCRITO", label: "Convertidos" },
  ];

  return (
    <div className="bg-white min-h-screen pb-32">
      
      {/* 🏙️ EXECUTIVE HEADER */}
      <section className="pt-20 pb-12 px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="relative bg-white border border-slate-100 p-10 lg:p-16 rounded-[4rem] overflow-hidden group shadow-[0_40px_80px_rgba(0,0,0,0.03)]">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-50/50 blur-[100px] rounded-full" />
            
            <div className="relative z-10 flex flex-col gap-12">
              <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="space-y-4">
                  <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Gestión de Prospectos</div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tight leading-[1.1]">
                    Prospectos más claros, <br />
                    acciones más rápidas.
                  </h1>
                </div>
                <button className="flex items-center gap-3 px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 text-[11px] font-black hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                  <Filter size={16} />
                  Filtros
                </button>
              </div>

              {/* 📊 BENTO STATS - SINGLE CONTAINER STYLE */}
              <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] overflow-hidden">
                <div className="p-10 border-r border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center md:text-left">Total</p>
                  <p className="text-5xl font-black text-slate-950 text-center md:text-left">{stats.total}</p>
                </div>
                <div className="p-10 border-r border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center md:text-left">Recientes</p>
                  <p className="text-5xl font-black text-indigo-600 text-center md:text-left">{stats.new}</p>
                </div>
                <div className="p-10 border-r border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center md:text-left">Seguimiento</p>
                  <p className="text-5xl font-black text-slate-950 text-center md:text-left">{stats.interested}</p>
                </div>
                <div className="p-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center md:text-left">Inscritos</p>
                  <p className="text-5xl font-black text-indigo-600 text-center md:text-left">{stats.converted}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 🔍 INTERACTIVE TOOLBAR */}
          <div className="mt-12 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Buscar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 placeholder:text-slate-500 text-[13px] font-bold"
              />
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-2xl overflow-x-auto no-scrollbar">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                    statusFilter === tab.value
                      ? "bg-slate-950 text-white shadow-lg"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12 flex justify-between items-end border-b border-slate-100 pb-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Prospectos</h2>
            <span className="text-[11px] font-bold text-slate-400">{filteredLeads.length} registrados</span>
          </div>
        </div>
      </section>

      {/* 📋 LEADS GRID */}
      <section className="max-w-[1600px] mx-auto px-8">
        <AnimatePresence mode="popLayout">
          {filteredLeads.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-40 bg-slate-50/50 border border-slate-100 rounded-[3rem] mt-8 flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="h-20 w-20 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 shadow-sm">
                <Users size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Buzón en espera</h3>
                <p className="text-slate-400 text-sm font-bold">No se encontraron prospectos con los <br /> criterios actuales.</p>
              </div>
              <button 
                onClick={() => { setSearch(""); setStatusFilter("ALL"); }}
                className="px-8 py-3.5 bg-slate-950 text-white rounded-2xl text-[11px] font-bold transition-all active:scale-95 shadow-xl hover:bg-indigo-600"
              >
                Restablecer filtros
              </button>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"
            >
              {filteredLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} activePlans={activePlans} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 🚀 FLOAT ACTION */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-12 right-12 z-[100]"
      >
        <button className="h-16 pl-8 pr-6 rounded-full bg-slate-950 text-white flex items-center gap-4 shadow-2xl shadow-indigo-200 hover:bg-indigo-600 transition-all group active:scale-95">
           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Centro de Ayuda</span>
           <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform">
             <ArrowRight size={18} />
           </div>
        </button>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string, value: string | number, color: string }) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-600",
    emerald: "text-emerald-600",
    violet: "text-violet-600",
    amber: "text-amber-600"
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 min-w-[140px]">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">{label}</p>
      <p className={`text-4xl font-black ${colors[color] || "text-slate-900"} tracking-tighter`}>{value}</p>
    </div>
  );
}
