import React, { useState, useEffect } from "react";
import { useLeadMetadata } from "@/lib/hooks/useLeadMetadata";
import { StickyNote, Tag, Bell, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LeadMetadataEditor({ leadId, initialMetadata }: { leadId: string, initialMetadata: any }) {
  const { metadata, updateMetadata, saving, error } = useLeadMetadata(leadId, initialMetadata);
  const [notes, setNotes] = useState(metadata?.notes?.join("\n") || "");
  const [tags, setTags] = useState(metadata?.tags?.join(", ") || "");
  const [reminderAt, setReminderAt] = useState(metadata?.reminderAt || "");

  // Sync state if metadata changes externally
  useEffect(() => {
    setNotes(metadata?.notes?.join("\n") || "");
    setTags(metadata?.tags?.join(", ") || "");
    setReminderAt(metadata?.reminderAt || "");
  }, [metadata]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5">
        <div className="relative group">
          <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">
            <StickyNote size={12} className="text-slate-300" />
            Notas Internas
          </label>
          <textarea
            className="w-full bg-slate-50/50 border border-slate-200/50 rounded-2xl p-4 text-sm text-slate-700 placeholder:text-slate-300 focus:bg-white focus:ring-[6px] focus:ring-indigo-500/5 focus:border-indigo-300 transition-all resize-none shadow-inner min-h-[100px]"
            rows={3}
            placeholder="Añade detalles relevantes..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={() => updateMetadata({ notes: notes.split("\n").filter(Boolean) })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="relative">
            <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">
              <Tag size={12} className="text-slate-300" />
              Etiquetas
            </label>
            <input
              className="w-full bg-slate-50/50 border border-slate-200/50 rounded-xl p-3 text-xs text-slate-700 placeholder:text-slate-300 focus:bg-white focus:ring-[6px] focus:ring-indigo-500/5 focus:border-indigo-300 transition-all shadow-inner"
              placeholder="Ej: Beca, Urgente"
              value={tags}
              onChange={e => setTags(e.target.value)}
              onBlur={() => updateMetadata({ tags: tags.split(",").map(t => t.trim()).filter(Boolean) })}
            />
          </div>

          <div className="relative">
            <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">
              <Bell size={12} className="text-slate-300" />
              Recordatorio
            </label>
            <input
              type="datetime-local"
              className="w-full bg-slate-50/50 border border-slate-200/50 rounded-xl p-3 text-xs text-slate-700 focus:bg-white focus:ring-[6px] focus:ring-indigo-500/5 focus:border-indigo-300 transition-all shadow-inner"
              value={reminderAt}
              onChange={e => setReminderAt(e.target.value)}
              onBlur={() => updateMetadata({ reminderAt })}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between min-h-[24px]">
        <AnimatePresence mode="wait">
          {saving ? (
            <motion.div 
              key="saving"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-indigo-500 uppercase"
            >
              <Loader2 size={12} className="animate-spin" />
              Sincronizando...
            </motion.div>
          ) : (
            <motion.div 
              key="saved"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-emerald-500 uppercase"
            >
              <Check size={12} className="stroke-[3px]" />
              Guardado en la nube
            </motion.div>
          )}
        </AnimatePresence>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[9px] font-black tracking-widest text-rose-500 uppercase bg-rose-50 px-2 py-1 rounded-md"
          >
            Error de conexión
          </motion.div>
        )}
      </div>
    </div>
  );
}
