"use client";

import { useState, useMemo, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnBoardingContext";
import { Check } from "lucide-react";
import { CategoryIcon } from "@/components/layout/CategoryIcon";
import { Input } from "@/components/ui/input";
import { schoolCategoriesService, Category } from "@/lib/services/services/schools-categories.service";


// Puedes cambiar esto por un servicio real de categorías de cursos si lo tienes
const CURSO_CATEGORIES = [
  { id: "1", name: "Arte", slug: "arte" },
  { id: "2", name: "Deportes", slug: "deportes" },
  { id: "3", name: "Tecnología", slug: "tecnologia" },
  { id: "4", name: "Idiomas", slug: "idiomas" },
  { id: "5", name: "Ciencias", slug: "ciencias" },
  { id: "6", name: "Música", slug: "musica" },
];

export default function Step2() {
  const { state, toggleCategory } = useOnboarding();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        if (state.data.tipoRegistro === "curso") {
          setCategories(CURSO_CATEGORIES);
        } else {
          const data = await schoolCategoriesService.getAllCategories();
          setCategories(data);
        }
      } catch (err) {
        console.error("Error loading categorías", err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data.tipoRegistro]);

  function isSelected(id: string) {
    return state.data.categories.some((c) => c.id === id);
  }

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, categories]);

  if (loading) {
    return <p>Cargando categorías...</p>;
  }

  // Handler para el botón continuar (ajusta según tu flujo)
  function handleContinue() {
    // Aquí va la lógica para continuar al siguiente paso
    // Por ejemplo: onNextStep();
  }

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* ...existing code... */}

      {/* Contenido principal */}
      <div className="relative z-10 max-w-6xl mx-auto pt-16 pb-10 space-y-10">
        <div>
          <p className="text-lg font-light text-neutral-600">
            Configuración de la cuenta
          </p>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight text-black">
            {state.data.tipoRegistro === "curso"
              ? "Selecciona las categorías que describen mejor el curso"
              : "Selecciona las categorías que describen mejor a la escuela"}
          </h1>
        </div>

        {/* SEARCH */}
        <div className="w-full">
          <Input
            placeholder="Buscar categorías"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl shadow-none border-none bg-[#f3f3f3] py-6"
          />
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCategories.map((category) => {
            const selected = isSelected(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`
                  relative flex items-center gap-3 px-8 h-24 rounded-2xl border transition-all text-xl font-medium shadow-sm
                  ${selected
                    ? "border-blue-500 ring-2 ring-blue-500 bg-blue-50"
                    : "border-neutral-300 hover:border-neutral-400 bg-white"}
                `}
              >
                <CategoryIcon
                  slug={category.slug}
                  className={`w-7 h-7 ${selected ? "text-blue-600" : "text-neutral-700"}`}
                />
                {category.name}
                {selected && (
                  <div className="absolute top-4 right-4 bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center">
                    <Check size={16} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {state.errors.categories && (
          <p className="text-red-500 text-sm">
            {state.errors.categories}
          </p>
        )}
      </div>
    </div>
  );
}