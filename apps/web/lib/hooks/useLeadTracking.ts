import { useCallback } from "react";
import { api } from "@/lib/services/api";

export function useLeadTracking({ userId }: { userId: string }) {
  const trackLead = useCallback(
    async ({
      targetId,
      originType,
      trigger,
      status,
      metadata,
    }: {
      targetId: string;
      originType: "SCHOOL" | "COURSE";
      trigger: "FAVORITE" | "INFO_REQUEST" | "CONTACT_MESSAGE" | "VISIT_SCHEDULE" | "VIEW";
      status: "NUEVO" | "INTERESADO" | "VISITA" | "INSCRITO";
      metadata?: any;
    }) => {
      await api("/leads/upsert", {
        method: "POST",
        body: { userId, targetId, originType, lastTrigger: trigger, status, metadata },
      });
    },
    [userId]
  );

  return { trackLead };
}
