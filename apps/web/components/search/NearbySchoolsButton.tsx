"use client";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { schoolsService } from "@/lib/services/services/schools.service";

export default function NearbySchoolsButton({ onResults }: { onResults: (schools: any[]) => void }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const handleNearby = () => {
    setLoading(true);
    setToast("");
    if (!navigator.geolocation) {
      setToast("Tu navegador no soporta geolocalización.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          setToast("Buscando escuelas cerca de ti...");
          const { latitude, longitude } = pos.coords;
          const schools = await schoolsService.getNearbySchools(latitude, longitude);
          onResults(schools);
          setToast("");
        } catch (e) {
          setToast("No se pudieron obtener escuelas cercanas.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setToast("No pudimos obtener tu ubicación. ¿Diste permiso?");
        setLoading(false);
      }
    );
  };

  return (
    <>
      <button
        onClick={handleNearby}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-slate-700 font-semibold shadow-sm hover:bg-slate-200 transition"
        style={{ minWidth: 180 }}
      >
        <MapPin className="w-5 h-5 text-indigo-500" />
        Escuelas cerca de mí
      </button>
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
