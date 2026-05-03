"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { coursesService } from "@/lib/services/services/courses.service";
import CatalogCard from "@/components/layout/CatalogCard";
import FavoriteDetailModal from "@/components/parents/FavoriteDetailModal";
import { useAuth } from "@/contexts/AuthContext";
import { favoritesService } from "@/lib/services/services/favorites.service";
import { useToast } from "@/components/ui/toast";
import { useLeadTracking } from "@/lib/hooks/useLeadTracking";

export default function CoursesFeed() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { trackLead } = useLeadTracking({ userId: user?.id || "" });
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const loc = searchParams.get("loc") || "";
  const minPrice = parseInt(searchParams.get("minPrice") || "0");
  const maxPrice = parseInt(searchParams.get("maxPrice") || "999999");
  const schedule = searchParams.get("schedule") || "";
  const modality = searchParams.get("modality") || "";

  const { data: courses, isLoading, refetch } = useQuery({
    queryKey: ["courses-feed", q, loc, minPrice, maxPrice, schedule, modality],
    queryFn: () => coursesService.listAll(),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const [open, setOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [courseFavorites, setCourseFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      favoritesService.listForMe().then(list => {
        setCourseFavorites(new Set(list.map(s => s.id)));
      }).catch(console.error);
    }
  }, [user?.id]);

  const toggleFavorite = async (courseId: string) => {
    if (!user?.id) {
      showToast({ title: "Inicia sesión para guardar favoritos", variant: "info" });
      return;
    }
    try {
      const result = await favoritesService.toggle(courseId);
      if (result.isFavorite) {
        setCourseFavorites((prev) => new Set([...prev, courseId]));
        showToast({ title: "Agregado a favoritos", variant: "success" });
        await trackLead({
          targetId: courseId,
          originType: "COURSE",
          trigger: "FAVORITE",
          status: "INTERESADO",
        });
      } else {
        setCourseFavorites((prev) => {
          const next = new Set(prev);
          next.delete(courseId);
          return next;
        });
        showToast({ title: "Removido de favoritos", variant: "success" });
      }
    } catch (error) {
      showToast({ title: "Error al actualizar favoritos", variant: "error" });
    }
  };

  if (isLoading) return <div className="text-center py-10">Cargando cursos…</div>;
  if (!courses || !courses.length) return <div className="text-center py-10">No se encontraron cursos.</div>;

  let filtered = courses;
  if (q) {
    const qLower = q.toLowerCase();
    filtered = filtered.filter(c => c.name.toLowerCase().includes(qLower) || (c.description?.toLowerCase().includes(qLower)));
  }
  if (loc) {
    const locLower = loc.toLowerCase();
    // @ts-ignore
    filtered = filtered.filter(c => (c.schoolName?.toLowerCase().includes(locLower)));
  }
  if (minPrice > 0) {
    filtered = filtered.filter(c => c.price >= minPrice);
  }
  if (maxPrice < 999999) {
    filtered = filtered.filter(c => c.price <= maxPrice);
  }
  if (schedule) {
    filtered = filtered.filter(c => c.startDate?.includes(schedule));
  }
  if (modality) {
    filtered = filtered.filter(c => (c.modality?.toLowerCase() === modality.toLowerCase()));
  }

  const handleOpenModal = (node: any) => {
    setSelectedNode(node);
    setOpen(true);
  };

  if (filtered.length === 0) return <div className="text-center py-10">No encontramos cursos con esos filtros. Intenta ajustar tu búsqueda.</div>;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((course: any) => (
          <CatalogCard
            key={course.id}
            imageSrc={course.coverImageUrl || ""}
            imageAlt={course.name}
            typeLabel="CURSO"
            title={course.name}
            location={course.schoolName || course.ownerName || "Sin ubicación"}
            priceLabel="PRECIO"
            price={course.price ?? 0}
            priceFormatted={
              typeof course.price === "number"
                ? `$${course.price.toLocaleString("es-MX")}`
                : "N/A"
            }
            planName={course.planName}
            description={course.description}
            studentsPerClass={course.capacity}
            isFavorite={courseFavorites.has(course.id)}
            onFavoriteToggle={() => toggleFavorite(course.id)}
            onCardClick={() => handleOpenModal(course)}
            onAction={() => handleOpenModal(course)}
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
            imageUrl: selectedNode.coverImageUrl || "",
            badges: [selectedNode.modality, "CURSO"].filter(Boolean),
            level: "CURSO",
            title: selectedNode.name,
            location: selectedNode.schoolName || selectedNode.ownerName || "Sin ubicación",
            price: selectedNode.price ?? "Por definir",
            description: selectedNode.description,
            rating: undefined,
            schedule: selectedNode.startDate ? `Inicio: ${selectedNode.startDate}` : undefined,
            languages: undefined,
            studentsPerClass: selectedNode.capacity,
            enrollmentOpen: undefined,
            enrollmentYear: undefined,
            monthlyPrice: undefined,
            gallery: selectedNode.gallery,
          }
        }
      />
    </>
  );
}
