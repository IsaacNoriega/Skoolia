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
import StyledSelect from "@/components/ui/StyledSelect";

export default function SearchBar() {
  const [activeTab, setActiveTab] = useState<"escuelas" | "cursos">("escuelas");

  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  // Modalidad solo para cursos
  const [modality, setModality] = useState("");

  const [aiMode, setAiMode] = useState(false);

  const router = useRouter();

  return (
    <div className="w-full px-30 flex flex-col items-center gap-2">
      {/* TABS */}
      {!aiMode && (
        <div className="w-full max-w-5xl flex items-center mb-1">
          <div className="flex bg-[#eeeff1] rounded-full p-1 gap-2">
            <button
              className={`px-6 py-2 rounded-full font-bold text-sm transition ${
                activeTab === "escuelas"
                  ? "bg-white text-[#333331] shadow"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab("escuelas")}
            >
              Escuelas
            </button>
            <button
              className={`px-6 py-2 rounded-full font-bold text-sm transition ${
                activeTab === "cursos"
                  ? "bg-white text-[#333331] shadow"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab("cursos")}
            >
              Cursos
            </button>
          </div>
        </div>
      )}

      {/* ANIMATED SWITCH */}
      <AnimatePresence mode="wait">
        {!aiMode ? (
          /* ================= NORMAL SEARCH ================= */
          <motion.div
            key="normal-search"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full flex flex-col items-center gap-4"
          >
            <div className="w-full max-w-5xl mx-auto bg-[#f3f3f3] rounded-full px-6 sm:px-8 py-3 flex flex-col gap-4">
              <div className="flex w-full flex-col md:flex-row md:items-center">

                {activeTab === "escuelas" ? (
                  <div className="flex-1 w-full">
                    <EducationInput value={query} onChange={setQuery} />
                  </div>
                ) : (
                  <>
                    <div className="flex-[1.2] items-center w-full">
                      <div className="flex items-center w-full px-4 py-3 rounded-xl transition focus-within:bg-neutral-50">
                        <GraduationCap className="text-black mr-3" size={26} />
                        <input
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                          placeholder="Nombre"
                          className="bg-transparent outline-none w-full text-base placeholder:text-black/56"
                        />
                      </div>
                    </div>
                    <div className="hidden md:block w-0.5 h-8 bg-[#d9d9d9] mx-2" />
                    <div className="flex-1 items-center w-full">
                      <div className="flex items-center px-4 py-3 rounded-xl transition focus-within:bg-neutral-50">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="text-black mr-2" style={{minWidth:22}}><rect width="22" height="22" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="#1973FC"/></svg>
                        <StyledSelect
                          value={modality}
                          onChange={setModality}
                          options={["Presencial", "En línea", "Híbrido"]}
                          placeholder="Modalidad"
                          variant="minimal"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="hidden md:block w-0.5 h-8 bg-[#d9d9d9] mx-2" />

                <div className="flex-1 w-full">
                  <CityInput value={city} onChange={setCity} />
                </div>

                <div className="hidden md:block w-0.5 h-8 bg-[#d9d9d9] mx-3" />

                <button
                  onClick={async () => {
                    const params = new URLSearchParams();

                    if (query.trim()) params.set("q", query.trim());
                    if (activeTab === "cursos" && modality) params.set("modality", modality);
                    if (city.trim()) {
                      if (city.trim() === "Cerca de mí") {
                        // Obtener ubicación y redirigir con lat/lon
                        if (typeof window !== "undefined" && "geolocation" in navigator) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              params.set("loc", "Cerca de mí");
                              params.set("near", "1");
                              params.set("lat", String(position.coords.latitude));
                              params.set("lon", String(position.coords.longitude));
                              params.set("tab", activeTab);
                              router.push(`/search?${params.toString()}`);
                            },
                            () => {
                              // Si falla, solo redirige con loc
                              params.set("loc", "Cerca de mí");
                              params.set("tab", activeTab);
                              router.push(`/search?${params.toString()}`);
                            },
                            {
                              enableHighAccuracy: true,
                              timeout: 12000,
                              maximumAge: 1000 * 60 * 15,
                            }
                          );
                          return;
                        }
                      } else {
                        params.set("loc", city.trim());
                      }
                    }
                    params.set("tab", activeTab);
                    router.push(`/search?${params.toString()}`);
                  }}
                  className="flex items-center justify-center bg-[#2d2c2b] hover:bg-[#1666e3] text-white font-bold px-8 py-3 rounded-full transition text-base md:ml-4 w-full md:w-auto"
                >
                  <Search strokeWidth={3} size={20} />
                </button>
              </div>
            </div>

            {/* IA BUTTON */}
            <div className="flex flex-col items-center gap-4">
              <GradientMagicButton onClick={() => setAiMode(true)}>
                <SparkleIcon size={16} />
                <span className="font-semibold">Buscar con IA</span>
              </GradientMagicButton>

              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-neutral-700">
                <span className="font-medium">Búsquedas populares:</span>

                {[
                  "Primaria bilingüe",
                  "Secundaria en Jalisco",
                  "Universidad privada",
                ].map((item, index) => (
                  <button
                    key={index}
                    className="px-3 py-1 bg-[#f3f3f3] hover:bg-neutral-300 rounded-full text-xs text-neutral-800 transition"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <AISearchMode onClose={() => setAiMode(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
