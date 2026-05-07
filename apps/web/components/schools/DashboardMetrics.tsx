import React from "react";
import { Users, TrendingUp, Zap, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardMetricsProps {
  metrics: {
    qualifiedLeads: number;
    leadsFee: string;
    successCommissions: string;
    totalToPay: string;
    conversionRate: string;
  };
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  const cards = [
    {
      title: "Leads Calificados",
      value: metrics.qualifiedLeads,
      icon: <Users className="text-blue-500" size={24} />,
      bg: "bg-blue-50",
      border: "border-blue-100",
      trend: "Interés detectado",
    },
    {
      title: "Cuota Skoolia (Total)",
      value: metrics.totalToPay,
      icon: <TrendingUp className="text-emerald-500" size={24} />,
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      trend: "Leads + Comisiones",
    },
    {
      title: "Comisiones Éxito (1%)",
      value: metrics.successCommissions,
      icon: <Zap className="text-amber-500" size={24} />,
      bg: "bg-amber-50",
      border: "border-amber-100",
      trend: "Por inscripciones",
    },
    {
      title: "Tasa de Conversión",
      value: metrics.conversionRate,
      icon: <Clock className="text-purple-500" size={24} />,
      bg: "bg-purple-50",
      border: "border-purple-100",
      trend: "De lead a inscrito",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={`flex flex-col justify-between rounded-2xl border ${card.border} ${card.bg} p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-600">{card.title}</h3>
            <div className="rounded-full bg-white p-2 shadow-sm">{card.icon}</div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{card.trend}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
