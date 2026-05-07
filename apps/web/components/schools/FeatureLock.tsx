"use client";

import { motion } from "framer-motion";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface FeatureLockProps {
  title: string;
  description: string;
  requiredPlan: string;
  onAction?: () => void;
}

export function FeatureLock({ title, description, requiredPlan }: FeatureLockProps) {
  const pathname = usePathname();
  const isCourseMode = pathname.startsWith("/courses");
  const accentColor = isCourseMode ? "text-violet-600" : "text-indigo-600";
  const accentBg = isCourseMode ? "bg-violet-600" : "bg-indigo-600";
  const accentHoverBg = isCourseMode ? "hover:bg-violet-700" : "hover:bg-indigo-700";
  const plansHref = isCourseMode ? "/courses/plans" : "/schools/plans";

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/50 p-8 py-16 backdrop-blur-sm sm:p-12 sm:py-24">
      {/* Background Decorative Elements */}
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-slate-100/50 blur-3xl" />
      <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-slate-50 blur-3xl" />

      <div className="relative flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-2xl shadow-slate-200"
        >
          <Lock size={32} />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-8 max-w-md"
        >
          <div className="flex items-center justify-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500`}>
              <Sparkles size={10} />
              Característica Premium
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            {description}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Link
            href={plansHref}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl ${accentBg} px-8 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all ${accentHoverBg} active:scale-95`}
          >
            Actualizar a {requiredPlan}
            <ArrowRight size={16} />
          </Link>
          <button
             onClick={() => window.history.back()}
             className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
          >
            Regresar
          </button>
        </motion.div>

        <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Skoolia Business • 2026
        </p>
      </div>
    </div>
  );
}
