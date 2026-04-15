"use client";


import React, { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { useOnboarding } from "@/contexts/OnBoardingContext";
import { useToast } from "@/components/ui/toast";
import EducationalLevelSelect from "./EducationalLevelSelect";
import { cityOptions, institutionTypeOptions } from "./onboarding-options";
import SchoolsMap from "../SchoolsMap";

export default function Step3() {
  const { state, setField, next, validate } = useOnboarding();
  const { showToast } = useToast();

  // Geocodificación con Nominatim
  const geocodeAddress = useCallback(async (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}, México`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
    try {
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'es', 'User-Agent': 'Skoolia/1.0 (contacto@skoolia.mx)' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Interceptar el botón siguiente de este paso
  const handleNext = useCallback(async () => {
    validate();
    if (!state.canContinue) return;
    const address = state.data.address;
    const city = state.data.city;
    if (address && city) {
      const geo = await geocodeAddress(address, city);
      if (geo) {
        setField("lat", geo.lat);
        setField("lng", geo.lng);
        showToast({
          title: "Coordenadas encontradas",
          description: `Latitud: ${geo.lat.toFixed(6)}, Longitud: ${geo.lng.toFixed(6)}`,
          variant: "success",
        });
      } else {
        setField("lat", null);
        setField("lng", null);
        showToast({
          title: "No se pudo geocodificar la dirección",
          description: "Verifica que la dirección y el estado sean correctos. Puedes continuar, pero las coordenadas no se guardarán.",
          variant: "error",
        });
      }
    } else {
      setField("lat", null);
      setField("lng", null);
    }
    next();
  }, [state, setField, next, validate, geocodeAddress, showToast]);

  // ...existing code...
  // Para conectar este handler, el botón 'Continuar' de este paso debe usar handleNext en vez de next directo.
  // Si el botón está en el layout, deberás pasar handleNext vía props/context.

  return (
    <div className="w-full max-w-3xl space-y-10">
      {/* HEADER */}
      <div className="space-y-4">
        <p className="text-lg font-light text-neutral-600">
          Configuración de la cuenta
        </p>

        <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight text-black">
          Nivel educativo de la escuela
        </h1>

        <p className="text-lg sm:text-xl font-light text-neutral-600 max-w-3xl">
          Este es el nombre comercial que verán tus clientes. Más adelante
          podrás añadir la razón social.
        </p>
      </div>

      {/* FORM */}
      <div className="space-y-8">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Nivel educativo */}
          <div className="space-y-3">
            <EducationalLevelSelect />

            {state.errors.educationalLevel && (
              <p className="text-sm text-red-500 px-2">
                {state.errors.educationalLevel}
              </p>
            )}
          </div>

          {/* Tipo de institución */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Tipo de institución</Label>

            <select
              value={state.data.institutionType}
              onChange={(e) => setField("institutionType", e.target.value)}
              className="
                h-16
                w-full
                rounded-full
                bg-[#f3f3f3]
                border-0
                text-lg
                px-8
                focus-visible:ring-2
                focus-visible:ring-black
                focus-visible:ring-offset-0
              "
            >
              <option value="">Selecciona un tipo</option>
              {institutionTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {state.errors.institutionType && (
              <p className="text-sm text-red-500 px-2">
                {state.errors.institutionType}
              </p>
            )}
          </div>
        </div>

        {/* Dirección */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold">Dirección</Label>
          <input
            value={state.data.address}
            onChange={(e) => setField("address", e.target.value)}
            placeholder="Calle, número, colonia"
            className="h-16 w-full rounded-full bg-[#f3f3f3] border-0 text-lg px-8 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0"
          />
          {state.errors.address && (
            <p className="text-sm text-red-500 px-2">{state.errors.address}</p>
          )}
        </div>

        {/* Estado */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold">Estado</Label>
          <select
            value={state.data.city}
            onChange={(e) => setField("city", e.target.value)}
            className="h-16 w-full rounded-full bg-[#f3f3f3] border-0 text-lg px-8 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0"
          >
            <option value="">Selecciona un estado</option>
            {cityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {state.errors.city && (
            <p className="text-sm text-red-500 px-2">{state.errors.city}</p>
          )}
        </div>

        {/* MAPA DE UBICACIÓN */}
        {state.data.lat && state.data.lng && (
          <div className="mt-8">
            <Label className="text-lg font-semibold mb-2 block">Ubicación en el mapa</Label>
            <div className="w-full" style={{ minHeight: 320 }}>
              <SchoolsMap
                schools={[
                  {
                    id: "preview",
                    name: state.data.schoolName || "Mi escuela",
                    lat: state.data.lat,
                    lng: state.data.lng,
                    level: state.data.educationalLevel,
                  },
                ]}
                userLocation={{ lat: state.data.lat, lng: state.data.lng }}
                height={320}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
