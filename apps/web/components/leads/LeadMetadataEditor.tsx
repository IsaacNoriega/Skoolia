import React, { useState } from "react";
import { useLeadMetadata } from "@/lib/hooks/useLeadMetadata";

export function LeadMetadataEditor({ leadId, initialMetadata }: { leadId: string, initialMetadata: any }) {
  const { metadata, updateMetadata, saving, error } = useLeadMetadata(leadId, initialMetadata);
  const [notes, setNotes] = useState(metadata?.notes?.join("\n") || "");
  const [tags, setTags] = useState(metadata?.tags?.join(", ") || "");
  const [reminderAt, setReminderAt] = useState(metadata?.reminderAt || "");

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold mb-1">Notas</label>
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => updateMetadata({ notes: notes.split("\n").filter(Boolean) })}
        />
      </div>
      <div>
        <label className="block text-xs font-bold mb-1">Etiquetas</label>
        <input
          className="w-full border rounded p-2"
          value={tags}
          onChange={e => setTags(e.target.value)}
          onBlur={() => updateMetadata({ tags: tags.split(",").map(t => t.trim()).filter(Boolean) })}
        />
      </div>
      <div>
        <label className="block text-xs font-bold mb-1">Recordatorio</label>
        <input
          type="datetime-local"
          className="w-full border rounded p-2"
          value={reminderAt}
          onChange={e => setReminderAt(e.target.value)}
          onBlur={() => updateMetadata({ reminderAt })}
        />
      </div>
      {saving && <div className="text-xs text-blue-500">Guardando...</div>}
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  );
}
