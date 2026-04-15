"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

// Fix de iconos de Leaflet para Webpack/Turbopack
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// @ts-ignore
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
// @ts-ignore
import markerIcon from "leaflet/dist/images/marker-icon.png";
// @ts-ignore
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Solo ejecutar en cliente
if (typeof window !== "undefined" && L && L.Icon && L.Icon.Default) {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x.src ?? markerIcon2x,
    iconUrl: markerIcon.src ?? markerIcon,
    shadowUrl: markerShadow.src ?? markerShadow,
  });
}

const MapContainer = dynamic(
  () => import("react-leaflet").then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then(mod => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then(mod => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then(mod => mod.Popup),
  { ssr: false }
);
const Circle = dynamic(
  () => import("react-leaflet").then(mod => mod.Circle),
  { ssr: false }
);

import Link from "next/link";

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

export default function SchoolsMap({ schools, userLocation, height = 400 }: SchoolsMapProps) {
  // Centro inicial: si hay userLocation, usarlo; si no, usar la primera escuela; si no, default México
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : schools.length > 0
    ? [schools[0].lat, schools[0].lng]
    : [23.6345, -102.5528]; // Centro de México

  useEffect(() => {
    // Forzar recálculo de iconos si cambia algo
  }, []);

  return (
    <div
      className="rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
      style={{ height, minHeight: 300 }}
    >
      <MapContainer
        center={center as [number, number]}
        zoom={userLocation ? 12 : 6}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {schools.map((school) => (
          <Marker key={school.id} position={[school.lat, school.lng]}>
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold text-slate-900">{school.name}</div>
                {school.level && (
                  <div className="text-xs text-slate-600">{school.level}</div>
                )}
                <Link
                  href={`/schools/${school.id}`}
                  className="inline-block mt-2 px-3 py-1 rounded-lg bg-black text-white text-xs font-semibold hover:bg-slate-800 transition"
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
            radius={120}
            pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.2 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
