"use client";

import { useEffect, useState } from "react";
import { enrollmentService } from "@/lib/services/services/enrollment.service";
import { coursesService } from "@/lib/services/services/courses.service";
import { motion } from "framer-motion";
import { ClipboardCheck, Calendar, CreditCard, User, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CourseEnrollmentsPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Get all courses owned by the user
    coursesService.listMine()
      .then(courses => {
        if (courses && courses.length > 0) {
          // Fetch enrollments for all courses and flatten
          return Promise.all(courses.map(c => 
            enrollmentService.getByTarget(c.id).then(list => 
              list.map(e => ({ ...e, courseName: c.name }))
            )
          ));
        }
        return [];
      })
      .then(results => results.flat())
      .then(setEnrollments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="p-8 space-y-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight text-violet-600">Inscripciones a Cursos</h1>
        <p className="text-sm text-slate-500 font-medium">Historial de alumnos que se han inscrito a tus cursos y talleres.</p>
      </header>

      {loading ? (
        <div className="grid place-items-center h-64">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
        </div>
      ) : enrollments.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-sm text-center space-y-6">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <BookOpen size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Sin inscripciones aún</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Tus alumnos aparecerán aquí cuando se inscriban a través de la app.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Alumno</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Curso</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Fecha</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Monto</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Estado</th>
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
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold">
                          {enrollment.userName?.charAt(0) || 'U'}
                        </div>
                        <span className="font-bold text-slate-900">{enrollment.userName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-medium text-slate-600">{enrollment.courseName}</span>
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
