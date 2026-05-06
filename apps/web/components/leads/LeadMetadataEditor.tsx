import React, { useState, useEffect } from "react";
import { useLeadMetadata } from "@/lib/hooks/useLeadMetadata";
import { StickyNote, Tag, Bell, Loader2, Check } from "lucide-react";

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
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4">
        <div className="relative group">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
            <StickyNote size={12} />
            Notas Internas
          </label>
          <textarea
            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-sm text-slate-700 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all resize-none shadow-inner"
            rows={2}
            placeholder="Añade detalles relevantes..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={() => updateMetadata({ notes: notes.split("\n").filter(Boolean) })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
              <Tag size={12} />
              Etiquetas
            </label>
            <input
              className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-700 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all shadow-inner"
              placeholder="Ej: Beca, Urgente"
              value={tags}
              onChange={e => setTags(e.target.value)}
              onBlur={() => updateMetadata({ tags: tags.split(",").map(t => t.trim()).filter(Boolean) })}
            />
          </div>

          <div className="relative">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
              <Bell size={12} />
              Recordatorio
            </label>
            <input
              type="datetime-local"
              className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all shadow-inner"
              value={reminderAt}
              onChange={e => setReminderAt(e.target.value)}
              onBlur={() => updateMetadata({ reminderAt })}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between min-h-[20px]">
        {saving ? (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            Guardando cambios...
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500/70">
            <Check size={12} />
            Actualizado
          </div>
        )}
        {error && <div className="text-[10px] font-bold text-rose-500">Error al guardar</div>}
      </div>
    </div>
  );
}

