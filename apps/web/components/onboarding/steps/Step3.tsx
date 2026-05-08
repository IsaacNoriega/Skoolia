"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { useOnboarding } from "@/contexts/OnBoardingContext";
import { useToast } from "@/components/ui/toast";
import EducationalLevelSelect from "./EducationalLevelSelect";
import { cityOptions, institutionTypeOptions } from "./onboarding-options";
import SchoolsMap from "../SchoolsMap";
import { geocodingService } from "@/lib/services/geocoding.service";
import { MapPin, Loader2, Globe, Building2, Map as MapIcon, Layers } from "lucide-react";
import { COURSE_MODALITIES } from "@/lib/constants";
import OnboardingSelect from "./OnboardingSelect";

export default function Step3() {
  const { state, setField, next, validate } = useOnboarding();
  const { showToast } = useToast();
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Auto-geocode when city changes and address is present
  useEffect(() => {
    if (state.data.address && state.data.city && !state.data.lat) {
      handleGeocode();
    }
  }, [state.data.city]);

  const handleGeocode = async () => {
    const address = state.data.address;
    const city = state.data.city;

    if (!city) {
      showToast({
        title: "Falta el estado",
        description: "Selecciona un estado para poder ubicarte en el mapa.",
        variant: "error",
      });
      return;
    }

    setIsGeocoding(true);
    showToast({
      title: "Buscando...",
      description: "Localizando tu dirección en el mapa.",
      variant: "info",
      duration: 2000,
    });

    const result = await geocodingService.geocodeAddressWithFallback(address || "", city);

    setIsGeocoding(false);

    if (result.success && result.data) {
      setField("lat", result.data.lat);
      setField("lng", result.data.lng);
      
      if (result.data.type === 'exact') {
        showToast({
          title: "Ubicación encontrada",
          description: "La dirección fue localizada con éxito.",
          variant: "success",
        });
      } else {
        showToast({
          title: "Ubicación aproximada",
          description: "No encontramos la calle exacta. Te mostramos la ciudad. Puedes mover el pin para ajustar.",
          variant: "warning",
        });
      }
    } else {
      showToast({
        title: "Error de ubicación",
        description: result.error || "No pudimos encontrar la ubicación.",
        variant: "error",
      });
    }
  };

  const onLocationChange = (lat: number, lng: number) => {
    setField("lat", lat);
    setField("lng", lng);
  };

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
              <OnboardingSelect
                label="Tipo de institución"
                placeholder="Selecciona un tipo"
                options={institutionTypeOptions}
                value={state.data.institutionType || ""}
                onChange={(val) => setField("institutionType", val)}
                icon={Building2}
                error={state.errors.institutionType}
              />
            </div>
            {/* Dirección */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Dirección</Label>
              <div className="flex gap-3">
                <input
                  value={state.data.address || ""}
                  onChange={(e) => setField("address", e.target.value)}
                  onBlur={() => {
                    if (state.data.address && state.data.city) handleGeocode();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGeocode();
                    }
                  }}
                  placeholder="Calle, número, colonia"
                  className="h-16 flex-1 rounded-full bg-[#f3f3f3] border-0 text-lg px-8 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0"
                />
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={isGeocoding || !state.data.city}
                  className="h-16 px-6 bg-slate-900 text-white rounded-full font-bold flex items-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all"
                >
                  {isGeocoding ? <Loader2 className="animate-spin" size={20} /> : <MapPin size={20} />}
                  <span className="hidden sm:inline">Buscar</span>
                </button>
              </div>
              {state.errors.address && (
                <p className="text-sm text-red-500 px-2">{state.errors.address}</p>
              )}
            </div>
            {/* Estado */}
            <OnboardingSelect
              label="Estado"
              placeholder="Selecciona un estado"
              options={cityOptions}
              value={state.data.city || ""}
              onChange={(val) => setField("city", val)}
              icon={MapIcon}
              error={state.errors.city}
              showSearch
            />
            {/* MAPA DE UBICACIÓN */}
            {state.data.lat && state.data.lng && (
              <div className="mt-8">
                <Label className="text-lg font-semibold mb-2 block">Ubicación en el mapa</Label>
                <SchoolsMap
                  schools={[{
                    id: "preview",
                    name: state.data.schoolName || "Tu ubicación",
                    lat: state.data.lat,
                    lng: state.data.lng,
                    level: state.data.educationalLevel || undefined,
                  }]}
                  userLocation={{ lat: state.data.lat, lng: state.data.lng }}
                  draggable={true}
                  onLocationChange={onLocationChange}
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
            <OnboardingSelect
              label="Modalidad"
              placeholder="Selecciona una modalidad"
              options={COURSE_MODALITIES}
              value={state.data.cursoModalidad || ""}
              onChange={(val) => setField("cursoModalidad", val)}
              icon={Layers}
            />

            {/* Instrucciones en línea solo si es En línea */}
            {state.data.cursoModalidad === "En línea" && (
              <div className="space-y-3">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <Globe size={20} />
                  Instrucciones o Link para el curso
                </Label>
                <input
                  value={state.data.onlineInstructions || ""}
                  onChange={e => setField("onlineInstructions", e.target.value)}
                  placeholder="Ej. Link de Zoom, instrucciones de acceso, etc. (Opcional)"
                  className="h-16 w-full rounded-full bg-[#f3f3f3] border-0 text-lg px-8 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0"
                />
              </div>
            )}
            {/* Dirección y estado solo si es presencial o híbrido */}
            {(state.data.cursoModalidad === "Presencial" || state.data.cursoModalidad === "Híbrido") && (
              <>
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Dirección</Label>
                  <div className="flex gap-3">
                    <input
                      value={state.data.address || ""}
                      onChange={(e) => setField("address", e.target.value)}
                      onBlur={() => {
                        if (state.data.address && state.data.city) handleGeocode();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleGeocode();
                        }
                      }}
                      placeholder="Calle, número, colonia"
                      className="h-16 flex-1 rounded-full bg-[#f3f3f3] border-0 text-lg px-8 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0"
                    />
                    <button
                      type="button"
                      onClick={handleGeocode}
                      disabled={isGeocoding || !state.data.city}
                      className="h-16 px-6 bg-slate-900 text-white rounded-full font-bold flex items-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all"
                    >
                      {isGeocoding ? <Loader2 className="animate-spin" size={20} /> : <MapPin size={20} />}
                      <span className="hidden sm:inline">Buscar</span>
                    </button>
                  </div>
                  {state.errors.address && (
                    <p className="text-sm text-red-500 px-2">{state.errors.address}</p>
                  )}
                </div>
                <OnboardingSelect
                  label="Estado"
                  placeholder="Selecciona un estado"
                  options={cityOptions}
                  value={state.data.city || ""}
                  onChange={(val) => setField("city", val)}
                  icon={MapIcon}
                  error={state.errors.city}
                  showSearch
                />
                {/* MAPA DE UBICACIÓN */}
                {state.data.lat && state.data.lng && (
                  <div className="mt-8">
                    <Label className="text-lg font-semibold mb-2 block">Ubicación en el mapa</Label>
                    <SchoolsMap
                      schools={[{
                        id: "preview",
                        name: state.data.cursoNombre || "Tu ubicación",
                        lat: state.data.lat,
                        lng: state.data.lng,
                      }]}
                      userLocation={{ lat: state.data.lat, lng: state.data.lng }}
                      draggable={true}
                      onLocationChange={onLocationChange}
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
