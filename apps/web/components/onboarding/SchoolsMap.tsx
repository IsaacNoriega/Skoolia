"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
// Importar CSS aquí es más seguro para evitar que el mapa se vea "roto" al cargar
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
};

// 2. Importaciones dinámicas (SOLO UNA VEZ)
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then(mod => mod.Circle), { ssr: false });

export default function SchoolsMap({ schools, userLocation, height = 400 }: SchoolsMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const leafletInitialized = useRef(false);

  // 3. Solución para los iconos de Leaflet (Fix para Next.js)
  useEffect(() => {
    setIsMounted(true);
    
    if (leafletInitialized.current) return;
    leafletInitialized.current = true;

    const fixLeafletIcons = async () => {
      const L = await import("leaflet");
      // @ts-ignore - Fix de iconos para que aparezcan en producción
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });
    };

    fixLeafletIcons();
  }, []);

  // 4. Lógica de centro del mapa
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : schools.length > 0
    ? [schools[0].lat, schools[0].lng]
    : [20.607, -103.391]; // Default ITESO/Tlaquepaque para tu demo

  // Evitar errores de hidratación
  if (!isMounted) return <div style={{ height, background: '#f1f5f9' }} className="rounded-2xl animate-pulse" />;

  return (
    <div
      className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
      style={{ height, minHeight: 300 }}
    >
      <MapContainer
        center={center}
        zoom={userLocation ? 13 : 6}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {schools.map((school) => (
          <Marker key={school.id} position={[school.lat, school.lng]}>
            <Popup>
              <div className="p-1">
                <div className="font-bold text-slate-900 text-sm">{school.name}</div>
                {school.level && (
                  <div className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider">
                    {school.level}
                  </div>
                )}
                <Link
                  href={`/schools/${school.id}`}
                  className="mt-3 block w-full text-center px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold hover:bg-indigo-700 transition-colors"
                >
                  Ver perfil
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={200}
            pathOptions={{ color: "#4f46e5", fillColor: "#4f46e5", fillOpacity: 0.15 }}
          />
        )}
      </MapContainer>
    </div>
  );
}