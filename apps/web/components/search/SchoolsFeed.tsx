"use client";
import { useState, useEffect } from "react";
import { useSchoolsFeed } from "@/lib/hooks/useSchoolsFeed";
import CatalogCard from "@/components/layout/CatalogCard";
import { resolveSchoolCardImage } from "@/lib/utils";
import FavoriteDetailModal from "@/components/parents/FavoriteDetailModal";
import { recordSchoolVisit } from "@/lib/history/school-history";
import { useAuth } from "@/contexts/AuthContext";
import { favoritesService } from "@/lib/services/services/favorites.service";
import { useToast } from "@/components/ui/toast";
import { useLeadTracking } from "@/lib/hooks/useLeadTracking";

export default function SchoolsFeed(props: any) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { trackLead } = useLeadTracking({ userId: user?.id || "" });
  const { data, isLoading, refetch } = useSchoolsFeed(props);

  const [open, setOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [schoolFavorites, setSchoolFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      favoritesService.listForMe().then(list => {
        setSchoolFavorites(new Set(list.map(s => s.id)));
      }).catch(console.error);
    }
  }, [user?.id]);

  const toggleFavorite = async (schoolId: string) => {
    if (!user?.id) {
      showToast({ title: "Inicia sesión para guardar favoritos", variant: "info" });
      return;
    }
    try {
      const result = await favoritesService.toggle(schoolId);
      if (result.isFavorite) {
        setSchoolFavorites((prev) => new Set([...prev, schoolId]));
        showToast({ title: "Agregado a favoritos", variant: "success" });
        await trackLead({
          targetId: schoolId,
          originType: "SCHOOL",
          trigger: "FAVORITE",
          status: "INTERESADO",
        });
      } else {
        setSchoolFavorites((prev) => {
          const next = new Set(prev);
          next.delete(schoolId);
          return next;
        });
        showToast({ title: "Removido de favoritos", variant: "success" });
      }
    } catch (error) {
      showToast({ title: "Error al actualizar favoritos", variant: "error" });
    }
  };

  if (isLoading) return <div className="text-center py-10">Cargando escuelas…</div>;
  if (!data || !data.edges.length) return <div className="text-center py-10">No se encontraron escuelas.</div>;

  const handleOpenModal = (node: any) => {
    setSelectedNode(node);
    setOpen(true);
    
    // Registrar visita en historial
    recordSchoolVisit(
      {
        id: node.id,
        name: node.name,
        imageSrc: resolveSchoolCardImage(node.id, node.coverImageUrl) || "",
        location: node.city || "Sin ubicación",
      },
      user?.id,
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.edges.map(({ node }: { node: any }) => (
          <CatalogCard
            key={node.id}
            imageSrc={resolveSchoolCardImage(node.id, node.coverImageUrl)}
            imageAlt={node.name}
            typeLabel="ESCUELA"
            title={node.name}
            location={node.city ?? "Sin ubicación"}
            priceLabel="MENSUALIDAD"
            price={node.monthlyPrice ?? 0}
            priceFormatted={
              typeof node.monthlyPrice === "number"
                ? `$${node.monthlyPrice.toLocaleString("es-MX")}`
                : "N/A"
            }
            planName={node.planName}
            description={node.description}
            languages={node.languages}
            studentsPerClass={node.maxStudentsPerClass}
            institutionType={node.institutionType}
            isFavorite={schoolFavorites.has(node.id)}
            onFavoriteToggle={() => toggleFavorite(node.id)}
            onCardClick={() => handleOpenModal(node)}
            onAction={() => handleOpenModal(node)}
          />
        ))}
      </div>

      <FavoriteDetailModal
        open={open}
        onClose={() => setOpen(false)}
        onRatingUpdated={() => refetch()}
        item={
          selectedNode && {
            id: selectedNode.id,
            imageUrl: resolveSchoolCardImage(selectedNode.id, selectedNode.coverImageUrl) || "",
            badges: [selectedNode.city, selectedNode.isVerified ? "VERIFICADA" : ""].filter(Boolean),
            level: "ESCUELA",
            title: selectedNode.name,
            location: selectedNode.city ?? "Sin ubicación",
            price: selectedNode.monthlyPrice ?? "Por definir",
            description: selectedNode.description,
            rating: selectedNode.averageRating,
            schedule: selectedNode.schedule,
            languages: selectedNode.languages,
            studentsPerClass: selectedNode.maxStudentsPerClass,
            enrollmentOpen: selectedNode.enrollmentOpen,
            enrollmentYear: selectedNode.enrollmentYear,
            monthlyPrice: selectedNode.monthlyPrice,
            gallery: selectedNode.gallery,
          }
        }
      />
    </>
  );
}

