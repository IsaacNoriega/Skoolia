"use client";

import { useEffect, useState } from "react";
import { enrollmentService } from "@/lib/services/services/enrollment.service";
import { motion } from "framer-motion";
import { ClipboardCheck, Calendar, CreditCard, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function MyEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enrollmentService.getMyEnrollments()
      .then(setEnrollments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mis Inscripciones</h1>
        <p className="text-slate-500 font-medium text-sm">Gestiona tus trámites de inscripción y reservaciones realizadas en Skoolia.</p>
      </header>

      {loading ? (
        <div className="grid place-items-center h-64">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : enrollments.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-sm text-center space-y-6">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <ClipboardCheck size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Aún no tienes inscripciones</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Explora la oferta académica de Skoolia e inscríbete hoy mismo en el colegio de tus sueños.</p>
          </div>
          <Link 
            href="/search" 
            className="inline-flex h-12 items-center justify-center px-8 bg-indigo-600 text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
          >
            Explorar Oferta
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Institución / Curso</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Fecha</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Monto</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {enrollments.map((enrollment, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={enrollment.id} 
                    className="hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{enrollment.targetName}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {enrollment.targetType === "SCHOOL" ? "Institución" : "Curso"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-sm font-medium">
                          {new Date(enrollment.createdAt).toLocaleDateString('es-MX', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <CreditCard size={14} className="text-slate-400" />
                        <span>${enrollment.amount.toLocaleString()} MXN</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        enrollment.status === 'COMPLETED' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {enrollment.status === 'COMPLETED' ? 'Confirmado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <ExternalLink size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
