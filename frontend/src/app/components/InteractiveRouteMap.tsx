import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  routeMapDisplay,
  type RouteCoordinate,
} from "@/app/api/routes";

type RouteMapProps = {
  coordinates?: RouteCoordinate[];
  routeName: string;
  mode?: "preview" | "interactive";
  fallbackImage?: string | null;
  filename?: string | null;
};

function markerIcon(label: string, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,0.92);box-shadow:0 10px 22px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font:700 11px Inter, sans-serif;">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function RouteMap({
  coordinates = [],
  routeName,
  mode = "interactive",
  fallbackImage = null,
  filename = null,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const display = useMemo(
    () => routeMapDisplay({ coordinates, image_url: fallbackImage, filename }),
    [coordinates, fallbackImage, filename],
  );
  const leafletPoints = useMemo<L.LatLngTuple[]>(
    () =>
      (display.kind === "map" ? display.coordinates : [])
        .map(([longitude, latitude]) => [latitude, longitude]),
    [display],
  );
  const isInteractive = mode === "interactive";

  useEffect(() => {
    if (!containerRef.current || leafletPoints.length === 0) {
      return;
    }

    const map = L.map(containerRef.current, {
      zoomControl: isInteractive,
      scrollWheelZoom: isInteractive,
      attributionControl: isInteractive,
      dragging: isInteractive,
      touchZoom: isInteractive,
      doubleClickZoom: isInteractive,
      boxZoom: isInteractive,
      keyboard: isInteractive,
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

    L.marker(leafletPoints[0], {
      icon: markerIcon("A", "#22c55e"),
      interactive: isInteractive,
      keyboard: isInteractive,
    })
      .addTo(map)
      .bindPopup("Start");
    L.marker(leafletPoints[leafletPoints.length - 1], {
      icon: markerIcon("B", "#c42050"),
      interactive: isInteractive,
      keyboard: isInteractive,
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
  }, [isInteractive, leafletPoints]);

  if (display.kind !== "map") {
    const src = display.kind === "image" ? display.src : fallbackImage;
    return (
      <div className="relative h-full w-full bg-[#121013]">
        {src ? (
          <img
            alt={`Map of ${routeName}`}
            className="h-full w-full object-cover"
            src={src}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[12px] text-[rgba(255,255,255,0.4)]">
            Map preview unavailable
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-[#121013]">
      <div
        ref={containerRef}
        role={isInteractive ? "region" : "img"}
        aria-label={`${isInteractive ? "Interactive map" : "Map preview"} of ${routeName}`}
        className={`h-full w-full ${isInteractive ? "" : "pointer-events-none"}`}
      />
      {!isInteractive && (
        <span className="pointer-events-none absolute bottom-[4px] right-[6px] rounded bg-[rgba(0,0,0,0.55)] px-[4px] py-[2px] text-[8px] text-[rgba(255,255,255,0.65)]">
          © OpenStreetMap contributors
        </span>
      )}
    </div>
  );
}
