import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { RouteCoordinate } from "@/app/api/routes";

type InteractiveRouteMapProps = {
  coordinates: RouteCoordinate[];
  routeName: string;
};

function markerIcon(label: string, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,0.92);box-shadow:0 10px 22px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font:700 11px Inter, sans-serif;">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function InteractiveRouteMap({
  coordinates,
  routeName,
}: InteractiveRouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const leafletPoints = useMemo<L.LatLngTuple[]>(
    () =>
      coordinates
        .filter(
          (point): point is RouteCoordinate =>
            Array.isArray(point) &&
            point.length === 2 &&
            Number.isFinite(point[0]) &&
            Number.isFinite(point[1]),
        )
        .map(([longitude, latitude]) => [latitude, longitude]),
    [coordinates],
  );

  useEffect(() => {
    if (!containerRef.current || leafletPoints.length === 0) {
      return;
    }

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.polyline(leafletPoints, {
      color: "#c42050",
      weight: 5,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    L.marker(leafletPoints[0], { icon: markerIcon("A", "#22c55e") })
      .addTo(map)
      .bindPopup("Start");
    L.marker(leafletPoints[leafletPoints.length - 1], {
      icon: markerIcon("B", "#c42050"),
    })
      .addTo(map)
      .bindPopup("Destination");

    if (leafletPoints.length === 1) {
      map.setView(leafletPoints[0], 15);
    } else {
      map.fitBounds(L.latLngBounds(leafletPoints), {
        padding: [28, 28],
        maxZoom: 16,
      });
    }

    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leafletPoints]);

  return (
    <div className="relative h-full w-full bg-[#121013]">
      <div
        ref={containerRef}
        role="region"
        aria-label={`Interactive map of ${routeName}`}
        className="h-full w-full"
      />
    </div>
  );
}
