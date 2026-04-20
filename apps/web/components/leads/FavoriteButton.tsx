// Ejemplo de uso del hook en un componente de curso o escuela
import { useState } from "react";
import { useLeadTracking } from "@/lib/hooks/useLeadTracking";
import { coursesService } from "@/lib/services/services/courses.service";
import { favoritesService } from "@/lib/services/services/favorites.service";

export function FavoriteButton({ userId, targetId, originType }: { userId: string, targetId: string, originType: "SCHOOL" | "COURSE" }) {
  const { trackLead } = useLeadTracking({ userId });
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFavorite = async () => {
    setLoading(true);
    try {
      let result;
      if (originType === "COURSE") {
        result = await coursesService.toggleFavorite(targetId);
      } else {
        result = await favoritesService.toggle(targetId);
      }
      setIsFavorite(result.isFavorite);
      trackLead({
        targetId,
        originType,
        trigger: "FAVORITE",
        status: "INTERESADO"
      });
    } catch {
      // opcional: mostrar error
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFavorite}
      disabled={loading}
      className={`text-blue-500 hover:text-blue-700 ${isFavorite ? "font-bold" : ""}`}
      title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      {isFavorite ? "💙" : "🤍"} Favorito
    </button>
  );
}
