"use client";
import { useEffect, useState } from "react";
import { getDistrictFromCoords } from "@/lib/geocoding";
import { MapPin } from "lucide-react";
export function LocationCell({
  lat,
  lng,
  latitude,
  longitude,
}: {
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const [district, setDistrict] = useState<string | null>(null);
  const effectiveLat = lat ?? latitude;
  const effectiveLng = lng ?? longitude;

  useEffect(() => {
    if (effectiveLat != null && effectiveLng != null) {
      getDistrictFromCoords(effectiveLat, effectiveLng).then(setDistrict);
    }
  }, [effectiveLat, effectiveLng]);

  if (effectiveLat == null || effectiveLng == null) {
    return <span className="text-muted-foreground">-</span>;
  }

  const mapsUrl = `https://www.google.com/maps?q=${effectiveLat},${effectiveLng}`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-link hover:opacity-80 font-medium hover:underline text-xs"
      title={`Coordenadas: ${effectiveLat}, ${effectiveLng} (Ver en Google Maps)`}
    >
      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="whitespace-nowrap">{district || "Cargando..."}</span>
    </a>
  );
}
