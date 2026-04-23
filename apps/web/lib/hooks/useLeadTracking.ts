import { useCallback } from "react";
import { api } from "@/lib/services/api";

export function useLeadTracking({ userId }: { userId: string }) {
  // Mapeo defensivo de triggers antiguos a los nuevos válidos
  function mapTrigger(trigger: string): "FAVORITE" | "VIEW_MORE" | "SCHEDULE_VISIT" | "INFO_REQUEST" | "CONTACT" | "INSCRIBIRME" {
    switch (trigger) {
      case "VIEW":
      case "VER_MAS":
        return "VIEW_MORE";
      case "VISIT_SCHEDULE":
      case "AGENDAR_CITA":
      case "SCHEDULE":
        return "SCHEDULE_VISIT";
      case "CONTACT_MESSAGE":
      case "CONTACTAR":
        return "CONTACT";
      case "INSCRIBIRME":
        return "INSCRIBIRME";
      case "FAVORITO":
        return "FAVORITE";
      case "INFO":
        return "INFO_REQUEST";
      case "FAVORITE":
      case "VIEW_MORE":
      case "SCHEDULE_VISIT":
      case "INFO_REQUEST":
      case "CONTACT":
      case "INSCRIBIRME":
        return trigger;
      default:
        return "VIEW_MORE"; // fallback seguro
    }
  }

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
      trigger: string;
      status: "NUEVO" | "INTERESADO" | "VISITA" | "INSCRITO";
      metadata?: any;
    }) => {
      const mappedTrigger = mapTrigger(trigger);
      await api("/leads/upsert", {
        method: "POST",
        body: { userId, targetId, originType, lastTrigger: mappedTrigger, status, metadata },
      });
    },
    [userId]
  );

  return { trackLead };
}
