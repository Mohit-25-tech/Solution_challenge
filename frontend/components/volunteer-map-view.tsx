"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"

interface VolunteerMapItem {
  id: number
  name: string
  email?: string
  latitude?: number | null
  longitude?: number | null
  skills: string[]
  is_available: boolean
  reliability_score: number
}

interface VolunteerMapViewProps {
  volunteers: VolunteerMapItem[]
}

export function VolunteerMapView({ volunteers }: VolunteerMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current).setView([22.0, 78.0], 5)
    mapInstanceRef.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 18,
    }).addTo(map)

    const bounds: L.LatLngBoundsExpression = []

    volunteers.forEach((v) => {
      if (v.latitude == null || v.longitude == null) return

      const color = v.is_available ? "#22c55e" : "#9ca3af"
      const borderColor = v.is_available ? "#16a34a" : "#6b7280"

      const icon = L.divIcon({
        html: `<div style="
          width: 14px; height: 14px;
          background: ${color};
          border: 2px solid ${borderColor};
          border-radius: 50%;
          box-shadow: 0 0 6px ${color}40;
        "></div>`,
        className: "",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })

      const marker = L.marker([v.latitude, v.longitude], { icon }).addTo(map)

      marker.bindPopup(`
        <div style="font-family: system-ui; min-width: 160px;">
          <p style="font-weight: 600; font-size: 13px; margin: 0 0 4px 0;">${v.name}</p>
          <p style="font-size: 11px; color: ${v.is_available ? '#16a34a' : '#6b7280'}; margin: 0 0 6px 0;">
            ${v.is_available ? '● Available' : '○ Unavailable'}
          </p>
          <p style="font-size: 11px; color: #6b7280; margin: 0 0 4px 0;">
            Skills: ${v.skills.join(', ').replace(/_/g, ' ')}
          </p>
          <p style="font-size: 11px; color: #6b7280; margin: 0;">
            Reliability: ${(v.reliability_score * 100).toFixed(0)}%
          </p>
        </div>
      `)

      ;(bounds as [number, number][]).push([v.latitude, v.longitude])
    })

    if ((bounds as [number, number][]).length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [30, 30] })
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [volunteers])

  return (
    <div
      ref={mapRef}
      className="w-full rounded-2xl overflow-hidden border border-gray-200"
      style={{ height: "calc(100vh - 240px)", minHeight: "400px" }}
    />
  )
}
