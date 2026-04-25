"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"

interface MapPinPickerProps {
  initialLat?: number
  initialLng?: number
  onChange: (lat: number, lng: number, label: string) => void
}

export function MapPinPicker({ initialLat = 23.022, initialLng = 72.571, onChange }: MapPinPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [label, setLabel] = useState("Click map to set location")

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Fix Leaflet default icon paths
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    })

    const map = L.map(mapRef.current).setView([initialLat, initialLng], 12)
    mapInstanceRef.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 18,
    }).addTo(map)

    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map)
    markerRef.current = marker

    const reverseGeocode = async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
        )
        const data = await res.json()
        const humanLabel = data.display_name?.split(",").slice(0, 3).join(",") || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        setLabel(humanLabel)
        onChange(lat, lng, humanLabel)
      } catch {
        const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        setLabel(fallback)
        onChange(lat, lng, fallback)
      }
    }

    marker.on("dragend", () => {
      const pos = marker.getLatLng()
      reverseGeocode(pos.lat, pos.lng)
    })

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      reverseGeocode(e.latlng.lat, e.latlng.lng)
    })

    // Initial reverse geocode
    reverseGeocode(initialLat, initialLng)

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  return (
    <div className="space-y-2">
      <div ref={mapRef} className="w-full h-[200px] rounded-xl overflow-hidden border border-gray-200" />
      <p className="text-xs text-gray-500 truncate">📍 {label}</p>
    </div>
  )
}
