"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, MapPin, Search } from "lucide-react";
import { SparkleIcon } from "@/lib/icons/StarIcon";
import { motion, AnimatePresence } from "framer-motion";
import { EducationInput } from "../parents/EducationInput";
import { CityInput } from "../parents/CityInput";
import { AISearchMode } from "../parents/IASearchMode";
import GradientMagicButton from "./GradientMagicButton";

export default function SearchBar() {
  const [activeTab, setActiveTab] = useState<"escuelas" | "cursos">("escuelas");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [modality, setModality] = useState("");
  const [aiMode, setAiMode] = useState(false);

  const router = useRouter();

  // Función de búsqueda extraída para limpieza
  const handleSearch = async () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (activeTab === "cursos" && modality) params.set("modality", modality);
    params.set("tab", activeTab);

    if (city.trim() === "Cerca de mí") {
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            params.set("loc", "Cerca de mí");
            params.set("near", "1");
            params.set("lat", String(position.coords.latitude));
            params.set("lon", String(position.coords.longitude));
            router.push(`/search?${params.toString()}`);
          },
          () => {
            params.set("loc", "Cerca de mí");
            router.push(`/search?${params.toString()}`);
          }
        );
        return; // Detenemos la ejecución aquí porque el redirect ocurre en el callback
      }
    }

    if (city.trim()) params.set("loc", city.trim());
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full px-4 md:px-20 flex flex-col items-center gap-6">
      {/* TABS */}
      {!aiMode && (
        <div className="w-full max-w-5xl flex items-center mb-1">
          <div className="flex bg-[#eeeff1] rounded-full p-1 gap-2">
            <button
              className={`px-6 py-2 rounded-full font-bold text-sm transition ${
                activeTab === "escuelas" ? "bg-white text-[#333331] shadow" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("escuelas")}
            >
              Escuelas
            </button>
            <button
              className={`px-6 py-2 rounded-full font-bold text-sm transition ${
                activeTab === "cursos" ? "bg-white text-[#333331] shadow" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("cursos")}
            >
              Cursos
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!aiMode ? (
          <motion.div
            key="normal-search"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full flex flex-col items-center gap-6"
          >
            <div className="w-full max-w-5xl mx-auto bg-[#f3f3f3] rounded-full px-6 py-2 flex items-center shadow-sm">
              <div className="flex flex-1 items-center">
                {activeTab === "escuelas" ? (
                  <EducationInput value={query} onChange={setQuery} />
                ) : (
                  <div className="flex items-center w-full">
                    <div className="flex items-center w-full px-4 py-3">
                      <GraduationCap className="text-black mr-3" size={26} />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Nombre del curso"
                        className="bg-transparent outline-none w-full text-base"
                      />
                    </div>
                    <div className="hidden md:block w-px h-8 bg-gray-300 mx-2" />
                    <select
                      value={modality}
                      onChange={(e) => setModality(e.target.value)}
                      className="bg-transparent outline-none text-base px-2 cursor-pointer"
                    >
                      <option value="">Modalidad</option>
                      <option value="Presencial">Presencial</option>
                      <option value="En línea">En línea</option>
                      <option value="Híbrido">Híbrido</option>
                    </select>
                  </div>
                )}

                <div className="hidden md:block w-px h-8 bg-gray-300 mx-4" />
                <CityInput value={city} onChange={setCity} />
              </div>

              <button
                onClick={handleSearch}
                className="ml-4 flex items-center justify-center bg-black hover:bg-neutral-800 text-white rounded-full min-w-[48px] h-12 transition"
              >
                <Search size={22} />
              </button>
            </div>

            <GradientMagicButton onClick={() => setAiMode(true)}>
              <SparkleIcon size={16} />
              <span className="font-semibold">Buscar con IA</span>
            </GradientMagicButton>

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-neutral-700">
              <span className="font-medium">Búsquedas populares:</span>
              {["Primaria bilingüe", "Secundaria en Jalisco", "Universidad privada"].map((item) => (
                <button
                  key={item}
                  onClick={() => setQuery(item)}
                  className="px-3 py-1 bg-[#f3f3f3] hover:bg-neutral-300 rounded-full text-xs transition"
                >
                  {item}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <AISearchMode onClose={() => setAiMode(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}