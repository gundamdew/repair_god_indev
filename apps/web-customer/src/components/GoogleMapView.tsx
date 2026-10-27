import { useEffect, useRef, useState } from "react"
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"
import type { Service } from "../data/mock"
import { Icon, Badge } from "../design-system"

interface GoogleMapViewProps {
  services: Service[]
  onSelectService: (id: number) => void
  selectedId?: number
  className?: string
}

// Minimalist Dark Theme Style for Google Maps
const darkMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#191b26" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#191b26" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9ba1b6" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#c8ccdc" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#7b88d4" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#152219" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#5eb888" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#252839" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1b1d2a" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a90a6" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#363c56" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#222536" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#b0b6cf" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#222536" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#7b88d4" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#121a22" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6f" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#121a22" }] }
]

// Minimalist Light Theme Style for Google Maps
const lightMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f7" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#515667" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#3f4a8a" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e3ebd9" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e6e8f4" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#d9e4ea" }] }
]

export default function GoogleMapView({ services, onSelectService, selectedId, className = "" }: GoogleMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activePartner, setActivePartner] = useState<Service | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() || ""

  useEffect(() => {
    if (!apiKey) {
      setLoadError("API Key missing")
      return
    }

    const isDark = document.documentElement.classList.contains("dark")
    let isMounted = true

    try {
      setOptions({
        key: apiKey,
        v: "weekly"
      })

      importLibrary("maps")
        .then(() => {
          if (!isMounted || !mapContainerRef.current) return

          const defaultCenter = { lat: 52.2319, lng: 21.0067 } // Warszawa Centrum
          const map = new google.maps.Map(mapContainerRef.current, {
            center: defaultCenter,
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true,
            styles: isDark ? darkMapStyle : lightMapStyle,
            gestureHandling: "greedy"
          })

          mapInstanceRef.current = map
          setIsLoaded(true)
          setLoadError(null)
        })
        .catch((err: Error) => {
          console.warn("Failed to load Google Maps API:", err)
          if (isMounted) setLoadError(err.message || "Failed to load Google Maps")
        })
    } catch (e: unknown) {
      const err = e as Error
      if (isMounted) setLoadError(err.message || "Error setting Google Maps options")
    }

    return () => {
      isMounted = false
    }
  }, [apiKey])

  // Update map styles when dark mode changes
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const isDark = document.documentElement.classList.contains("dark")
    mapInstanceRef.current.setOptions({
      styles: isDark ? darkMapStyle : lightMapStyle
    })
  }, [isLoaded])

  // Render markers when services or map changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || typeof google === "undefined") return

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    const bounds = new google.maps.LatLngBounds()

    services.forEach(s => {
      if (!s.lat || !s.lng) return

      const position = { lat: s.lat, lng: s.lng }
      bounds.extend(position)

      const isSelected = selectedId === s.id
      const marker = new google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: s.name,
        label: {
          text: `${s.price} zł`,
          color: isSelected ? "#ffffff" : "#1d1f2b",
          fontSize: "12px",
          fontWeight: "700"
        },
        icon: {
          path: "M -24,-12 L 24,-12 A 12,12 0 0,1 24,12 L -24,12 A 12,12 0 0,1 -24,-12 Z",
          fillColor: isSelected ? "#3f4a8a" : "#ffffff",
          fillOpacity: 0.95,
          strokeColor: isSelected ? "#7b88d4" : "rgba(0,0,0,0.15)",
          strokeWeight: 1.5,
          scale: 1,
          labelOrigin: new google.maps.Point(0, 1)
        }
      })

      marker.addListener("click", () => {
        setActivePartner(s)
        mapInstanceRef.current?.panTo(position)
      })

      markersRef.current.push(marker)
    })

    if (!bounds.isEmpty()) {
      mapInstanceRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
      const listener = google.maps.event.addListener(mapInstanceRef.current, "idle", () => {
        if (mapInstanceRef.current && (mapInstanceRef.current.getZoom() ?? 12) > 15) {
          mapInstanceRef.current.setZoom(14)
        }
        google.maps.event.removeListener(listener)
      })
    }
  }, [services, selectedId, isLoaded])

  // Fallback interactive map when no API key or network error
  if (loadError || !apiKey) {
    return (
      <div className={`relative w-full aspect-[4/3] lg:aspect-auto lg:h-full rounded-[28px] overflow-hidden grad-sage flex flex-col justify-between p-4 ${className}`}>
        {/* Background decorative road grid */}
        <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden>
          <path d="M0 60 Q30 50 50 62 T100 55" stroke="#fff" strokeWidth="3" fill="none" />
          <path d="M40 0 L45 100M0 30 L100 25" stroke="#fff" strokeWidth="1.5" fill="none" />
        </svg>

        {/* Center user location marker */}
        <div className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-[var(--accent)] ring-8 ring-[var(--accent)]/15 pointer-events-none" />

        {/* API notice badge */}
        <div className="relative z-10 mx-auto max-w-sm glass-strong rounded-2xl px-4 py-2.5 text-center text-xs space-y-1 shadow-sm">
          <div className="font-bold flex items-center justify-center gap-1.5 text-[var(--ink)]">
            <Icon.map /> Google Maps Integration
          </div>
          <div className="text-[var(--muted)] leading-tight">
            {!apiKey
              ? "Wprowadź VITE_GOOGLE_MAPS_API_KEY w pliku .env, aby włączyć mapy satelitarne i wektorowe Google"
              : "Ładowanie map Google..."}
          </div>
        </div>

        {/* Partner markers on fallback map */}
        <div className="absolute inset-0 pointer-events-none">
          {services.map((s, idx) => {
            const left = s.x || (30 + (idx * 16) % 60)
            const top = s.y || (25 + (idx * 18) % 55)
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActivePartner(s)
                  onSelectService(s.id)
                }}
                style={{ left: `${left}%`, top: `${top}%` }}
                className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 glass-strong rounded-full h-9 px-3.5 text-sm font-bold cursor-pointer num shadow-sm hover:scale-105 active:scale-95 transition text-[var(--ink)]"
              >
                {s.price} zł
              </button>
            )
          })}
        </div>

        {/* Active Partner Callout Card */}
        {activePartner && (
          <div className="relative z-20 mt-auto glass-strong rounded-2xl p-4 shadow-lg space-y-2 border border-white/40 dark:border-white/10 screen-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-[15px] text-[var(--ink)]">{activePartner.name}</div>
                <div className="text-xs text-[var(--muted)]">{activePartner.area} · {activePartner.dist} km</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-[var(--ink)] num">{activePartner.price} zł</div>
                <div className="text-[11px] text-[var(--muted)]">{activePartner.days} d</div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="flex items-center gap-1 text-xs font-semibold text-[var(--ink)] num">
                <Icon.star /> {activePartner.rating} <span className="text-[var(--muted)] font-normal">({activePartner.reviews})</span>
              </span>
              <button
                onClick={() => onSelectService(activePartner.id)}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] cursor-pointer"
              >
                Wybierz serwis →
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative w-full aspect-[4/3] lg:aspect-auto lg:h-full rounded-[28px] overflow-hidden ${className}`}>
      {/* Real Google Maps Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Selected Partner Popup Card on top of Google Map */}
      {activePartner && (
        <div className="absolute inset-x-4 bottom-4 z-10 glass-strong rounded-2xl p-4 shadow-xl space-y-2 border border-white/40 dark:border-white/10 screen-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="font-bold text-[15px] text-[var(--ink)]">{activePartner.name}</div>
                {activePartner.promoted && <Badge tone="warn">Polecany</Badge>}
              </div>
              <div className="text-xs text-[var(--muted)] mt-0.5">{activePartner.area} · {activePartner.spec}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-sm text-[var(--ink)] num">{activePartner.price} zł</div>
              <div className="text-[11px] text-[var(--muted)]">{activePartner.days} dni</div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
            <span className="flex items-center gap-1 text-xs font-semibold text-[var(--ink)] num">
              <Icon.star /> {activePartner.rating} <span className="text-[var(--muted)] font-normal">({activePartner.reviews} opinii)</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setActivePartner(null)}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                Zamknij
              </button>
              <button
                onClick={() => onSelectService(activePartner.id)}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shadow-sm cursor-pointer"
              >
                Wybierz serwis →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
