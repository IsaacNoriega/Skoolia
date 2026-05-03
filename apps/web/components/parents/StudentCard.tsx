'use client';
import { Pencil, Trash2, UserRound, GraduationCap, Heart, Sparkles, User, Baby } from 'lucide-react';
import { motion } from 'framer-motion';
import { Student } from '@/lib/services/services/student.service';

interface Props {
  student: Student;
  interests?: string[];
  onEdit: () => void;
  onDelete: () => void;
}

function formatCurrency(value: number | null) {
  if (value == null) return '—';
  try {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value} MXN`;
  }
}

export default function StudentCard({ student, interests = [], onEdit, onDelete }: Props) {
  // Simple heuristic to extract avatar if it was added to the name, otherwise use default
  const avatar = "👦"; 

  return (
    <motion.section 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full rounded-[2.5rem] bg-white p-8 shadow-2xl shadow-indigo-100/50 border border-slate-50 relative overflow-hidden"
    >
      {/* Decorative Background Element */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-50/30 blur-3xl" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-4xl shadow-xl shadow-indigo-200">
              {avatar}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-lg border border-slate-50">
              <Sparkles className="h-4 w-4 text-indigo-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-3xl font-black tracking-tight text-slate-900">{student.name}</h3>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                Estudiante
              </span>
            </div>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Perfil del Alumno</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onEdit}
            className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-all hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-200 active:scale-95"
            title="Editar Perfil"
          >
            <Pencil size={20} className="transition-transform group-hover:rotate-12" />
          </button>
          <button
            onClick={onDelete}
            className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-400 transition-all hover:bg-rose-600 hover:text-white hover:shadow-lg hover:shadow-rose-200 active:scale-95"
            title="Eliminar Perfil"
          >
            <Trash2 size={20} className="transition-transform group-hover:shake" />
          </button>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Edad Card */}
        <div className="group rounded-[2rem] border-2 border-slate-100 bg-white p-6 transition-all hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Baby size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Edad</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{student.age} años</p>
        </div>

        {/* Presupuesto Card */}
        <div className="group rounded-[2rem] border-2 border-slate-100 bg-white p-6 transition-all hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-50 sm:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Heart size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Presupuesto Mensual</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900">{formatCurrency(student.monthlyBudget)}</p>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">MXN / MES</span>
          </div>
        </div>
      </div>

      {interests.length > 0 && (
        <div className="relative z-10 mt-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-px flex-1 bg-slate-100" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Intereses Seleccionados</p>
            <span className="h-px flex-1 bg-slate-100" />
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {interests.map((i) => (
              <motion.span 
                key={i}
                whileHover={{ y: -2 }}
                className="rounded-2xl border-2 border-indigo-50 bg-indigo-50/30 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-indigo-600 shadow-sm"
              >
                {i}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}
