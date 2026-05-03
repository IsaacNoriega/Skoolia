"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Circle 
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// 1. Definición de tipos
export type SchoolMapItem = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  level?: string;
};

export type UserLocation = {
  lat: number;
  lng: number;
};

type SchoolsMapProps = {
  schools: SchoolMapItem[];
  userLocation?: UserLocation;
  height?: number | string;
  draggable?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
};

export default function SchoolsMap({ schools, userLocation, height = 400, draggable = false, onLocationChange }: SchoolsMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const leafletInitialized = useRef(false);
  const markerRef = useRef<any>(null);

  // 3. Solución para los iconos de Leaflet (Fix para Next.js)
  useEffect(() => {
    setIsMounted(true);

    if (leafletInitialized.current) return;
    leafletInitialized.current = true;

    const fixLeafletIcons = async () => {
      const L = await import("leaflet");
      // @ts-ignore - Fix de iconos para que aparezcan en producción
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });
    };

    fixLeafletIcons();
  }, []);

  // 4. Lógica de centro del mapa
  const center: [number, number] = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    if (schools.length > 0 && typeof schools[0].lat === 'number' && typeof schools[0].lng === 'number') {
      return [schools[0].lat, schools[0].lng];
    }
    return [20.607, -103.391]; // Default ITESO
  }, [userLocation, schools]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const position = marker.getLatLng();
          onLocationChange?.(position.lat, position.lng);
        }
      },
    }),
    [onLocationChange],
  );

  // Evitar errores de hidratación
  if (!isMounted) return <div style={{ height, background: '#f8fafc' }} className="rounded-[3rem] animate-pulse" />;

  // Validar coordenadas mínimas para evitar errores de Leaflet
  const validCenter = center && typeof center[0] === 'number' && typeof center[1] === 'number';
  if (!validCenter) return <div style={{ height, background: '#f8fafc' }} className="rounded-[3rem] flex items-center justify-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">Mapa no disponible</div>;

  return (
    <div
      className="rounded-[3rem] overflow-hidden relative w-full h-full"
      style={{ height }}
    >
      {draggable && (
        <div className="absolute top-4 right-4 z-[1000] bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg text-[11px] font-bold text-slate-700 border border-white/20 pointer-events-none">
          Mueve el pin para ajustar
        </div>
      )}
      <MapContainer
        center={center}
        zoom={userLocation ? 14 : 15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {schools.map((school) => {
          if (school.id === "preview" && draggable) return null;
          if (typeof school.lat !== 'number' || typeof school.lng !== 'number') return null;
          
          return (
            <Marker key={school.id} position={[school.lat, school.lng]}>
              <Popup>
                <div className="p-2 min-w-[150px]">
                  <div className="font-black text-slate-900 text-sm mb-1">{school.name}</div>
                  {school.level && (
                    <div className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                      {school.level}
                    </div>
                  )}
                  {school.id !== "preview" && (
                    <Link
                      href={`/search/institutions/${school.id}`}
                      className="mt-3 block w-full text-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-[11px] font-black hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                    >
                      Ver perfil
                    </Link>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {userLocation && (
          <>
            {draggable ? (
               <Marker 
                 draggable={draggable}
                 eventHandlers={eventHandlers}
                 position={[userLocation.lat, userLocation.lng]}
                 ref={markerRef}
               >
                 <Popup>
                   <div className="p-1 text-center font-bold text-slate-900 text-sm">
                     Tu ubicación
                   </div>
                 </Popup>
               </Marker>
            ) : (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={200}
                pathOptions={{ color: "#4f46e5", fillColor: "#4f46e5", fillOpacity: 0.15 }}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}