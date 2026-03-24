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
              Ecuelas
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
                <EducationInput value={query} onChange={setQuery} />

                <div className="hidden md:block w-0.5 h-8 bg-[#d9d9d9] mx-3" />

                <CityInput value={city} onChange={setCity} />

                <div className="hidden md:block w-0.5 h-8 bg-[#d9d9d9] mx-3" />

                <button
                  onClick={() => {
                    const params = new URLSearchParams();

                    if (query.trim()) params.set("q", query.trim());
                    if (city.trim()) params.set("loc", city.trim());
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
