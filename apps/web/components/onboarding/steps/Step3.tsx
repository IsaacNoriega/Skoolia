"use client";
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
  return (
    <div className="w-full max-w-3xl space-y-10">
      {/* HEADER */}
      <div className="space-y-4">
        <p className="text-lg font-light text-neutral-600">
          Configuración de la cuenta
        </p>

        <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight text-black">
          {state.data.tipoRegistro === "curso"
            ? "Información del curso"
            : "Nivel educativo de la escuela"}
        </h1>

        <p className="text-lg sm:text-xl font-light text-neutral-600 max-w-3xl">
          {state.data.tipoRegistro === "curso"
            ? "Completa los datos principales del curso."
            : "Este es el nombre comercial que verán tus clientes. Más adelante podrás añadir la razón social."}
        </p>
      </div>

      {/* FORM */}
      <div className="space-y-8">
        {state.data.tipoRegistro === "escuela" ? (
          <>
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
                  className="h-16 w-full rounded-full bg-[#f3f3f3] border-0 text-lg px-8 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0"
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
                onChange={async (e) => {
                  setField("address", e.target.value);
                  // Geocodifica en tiempo real
                  if (state.data.city && e.target.value) {
                    const geo = await geocodeAddress(e.target.value, state.data.city);
                    if (geo) {
                      setField("lat", geo.lat);
                      setField("lng", geo.lng);
                    }
                  }
                }}
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
                onChange={async (e) => {
                  setField("city", e.target.value);
                  // Geocodifica en tiempo real
                  if (state.data.address && e.target.value) {
                    const geo = await geocodeAddress(state.data.address, e.target.value);
                    if (geo) {
                      setField("lat", geo.lat);
                      setField("lng", geo.lng);
                    }
                  }
                }}
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
                <SchoolsMap
                  schools={[{
                    id: "preview",
                    name: state.data.schoolName || state.data.cursoNombre || "Ubicación temporal",
                    lat: state.data.lat,
                    lng: state.data.lng,
                    level: state.data.educationalLevel || undefined,
                  }]}
                  userLocation={{ lat: state.data.lat, lng: state.data.lng }}
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Para curso: campos requeridos */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Duración del curso (horas)</Label>
              <input
                type="number"
                min={1}
                value={state.data.cursoDuracion || ""}
                onChange={e => setField("cursoDuracion", e.target.value)}
                placeholder="Ej. 20"
                className="h-16 w-full rounded-full bg-[#f3f3f3] border-0 text-lg px-8 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Modalidad</Label>
              <select
                value={state.data.cursoModalidad || ""}
                onChange={e => setField("cursoModalidad", e.target.value)}
                className="h-16 w-full rounded-full bg-[#f3f3f3] border-0 text-lg px-8 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0"
              >
                <option value="">Selecciona una modalidad</option>
                <option value="presencial">Presencial</option>
                <option value="en-linea">En línea</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>
            {/* Dirección y estado solo si es presencial o híbrido */}
            {(state.data.cursoModalidad === "presencial" || state.data.cursoModalidad === "hibrido") && (
              <>
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Dirección</Label>
                  <input
                    value={state.data.address || ""}
                    onChange={async (e) => {
                      setField("address", e.target.value);
                      if (state.data.city && e.target.value) {
                        const geo = await geocodeAddress(e.target.value, state.data.city);
                        if (geo) {
                          setField("lat", geo.lat);
                          setField("lng", geo.lng);
                        }
                      }
                    }}
                    placeholder="Calle, número, colonia"
                    className="h-16 w-full rounded-full bg-[#f3f3f3] border-0 text-lg px-8 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0"
                  />
                  {state.errors.address && (
                    <p className="text-sm text-red-500 px-2">{state.errors.address}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Estado</Label>
                  <select
                    value={state.data.city}
                    onChange={async (e) => {
                      setField("city", e.target.value);
                      if (state.data.address && e.target.value) {
                        const geo = await geocodeAddress(state.data.address, e.target.value);
                        if (geo) {
                          setField("lat", geo.lat);
                          setField("lng", geo.lng);
                        }
                      }
                    }}
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
                    <SchoolsMap
                      schools={[{
                        id: "preview",
                        name: state.data.schoolName || state.data.cursoNombre || "Ubicación temporal",
                        lat: state.data.lat,
                        lng: state.data.lng,
                        level: state.data.educationalLevel || undefined,
                      }]}
                      userLocation={{ lat: state.data.lat, lng: state.data.lng }}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
