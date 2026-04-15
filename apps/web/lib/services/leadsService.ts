import { api } from "./api";

/**
 * Actualiza el estado de un lead.
 * @param leadId ID del lead
 * @param newStatus Nuevo estado (string)
 */
export async function updateLeadStatus(leadId: string, newStatus: string): Promise<void> {
  await api(`/leads/${leadId}/status`, {
    method: "PATCH",
    body: { status: newStatus },
  });
}
