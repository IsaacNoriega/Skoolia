// Ejemplo de uso del hook en un componente de curso o escuela
import { useLeadTracking } from "@/lib/hooks/useLeadTracking";

export function FavoriteButton({ userId, targetId, originType }: { userId: string, targetId: string, originType: "SCHOOL" | "COURSE" }) {
  const { trackLead } = useLeadTracking({ userId });
  return (
    <button
      onClick={() => trackLead({
        targetId,
        originType,
        trigger: "FAVORITE",
        status: "INTERESADO"
      })}
      className="text-blue-500 hover:text-blue-700"
    >
      ❤️ Favorito
    </button>
  );
}
