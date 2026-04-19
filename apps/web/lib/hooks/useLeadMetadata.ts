import { useState } from "react";
import { api } from "@/lib/services/api";

export function useLeadMetadata(leadId: string, initialMetadata: any) {
  const [metadata, setMetadata] = useState(initialMetadata);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMetadata = async (patch: any) => {
    setSaving(true);
    setError(null);
    try {
      const newMetadata = { ...metadata, ...patch };
      await api(`/leads/${leadId}/metadata`, {
        method: "PATCH",
        body: { metadata: newMetadata },
      });
      setMetadata(newMetadata);
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return { metadata, updateMetadata, saving, error };
}
