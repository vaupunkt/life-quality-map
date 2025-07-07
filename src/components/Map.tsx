'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface QualityScore {
  overall: number
  kindergarten: number
  schools: number
  supermarkets: number
  doctors: number
  pharmacies: number
  culture: number
  sports: number
  parks: number
  transport: number
  restaurants: number
  shopping: number
  finance: number
  safety: number
  services: number
  education: number
  noise: number
  traffic: number
  address: string
  lat: number
  lng: number
  amenities?: {
    kindergartens: Array<{lat: number, lng: number, name: string}>
    schools: Array<{lat: number, lng: number, name: string}>
    supermarkets: Array<{lat: number, lng: number, name: string}>
    doctors: Array<{lat: number, lng: number, name: string}>
    pharmacies: Array<{lat: number, lng: number, name: string}>
    culture: Array<{lat: number, lng: number, name: string, type: string}>
    sports: Array<{lat: number, lng: number, name: string, type: string}>
    parks: Array<{lat: number, lng: number, name: string}>
    transport: Array<{lat: number, lng: number, name: string, type: string}>
    restaurants: Array<{lat: number, lng: number, name: string, type: string}>
    shopping: Array<{lat: number, lng: number, name: string, type: string}>
    finance: Array<{lat: number, lng: number, name: string, type: string}>
    safety: Array<{lat: number, lng: number, name: string, type: string}>
    services: Array<{lat: number, lng: number, name: string, type: string}>
    education: Array<{lat: number, lng: number, name: string, type: string}>
  }
}

interface MapProps {
  qualityScore: QualityScore | null
  onLocationClick?: (lat: number, lng: number) => void
  showHeatmap?: boolean
  radiusSettings?: {
    walking: number
    cycling: number  
    driving: number
    activeRadius: 'walking' | 'cycling' | 'driving'
  }
  categoryVisibility?: {[key: string]: boolean}
}

export default function Map({ 
  qualityScore, 
  onLocationClick, 
  showHeatmap = false, 
  radiusSettings = {
    walking: 400,
    cycling: 1200,
    driving: 2500,
    activeRadius: 'walking'
  },
  categoryVisibility = {}
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const radiusCircleRef = useRef<L.Circle | null>(null)
  const heatmapRef = useRef<L.LayerGroup | null>(null)

  // Custom icons for different amenity types
  const createCustomIcon = (color: string, icon: string) => {
    return L.divIcon({
      html: `<div style="background-color: ${color}; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${icon}</div>`,
      className: 'custom-div-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })
  }

  const amenityIcons = {
    kindergarten: createCustomIcon('#22c55e', 'K'),
    school: createCustomIcon('#3b82f6', 'S'),
    education: createCustomIcon('#4f46e5', 'U'),
    supermarket: createCustomIcon('#f59e0b', 'M'),
    doctor: createCustomIcon('#ef4444', 'A'),
    pharmacy: createCustomIcon('#8b5cf6', 'P'),
    culture: createCustomIcon('#ec4899', 'C'),
    sports: createCustomIcon('#f97316', 'W'),
    parks: createCustomIcon('#10b981', 'N'),
    transport: createCustomIcon('#6366f1', 'T'),
    restaurants: createCustomIcon('#d97706', 'R'),
    shopping: createCustomIcon('#0d9488', 'E'),
    finance: createCustomIcon('#15803d', 'F'),
    safety: createCustomIcon('#b91c1c', 'Si'),
    services: createCustomIcon('#6b7280', 'Se')
  }

  useEffect(() => {
    if (!containerRef.current) return

    // Cleanup any existing map instance
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    // Initialize map
    const map = L.map(containerRef.current, {
      center: [52.5200, 13.4050], // Berlin center
      zoom: 13,
      zoomControl: true,
      preferCanvas: true, // Better performance
    })

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map)

    // Initialize layer groups
    markersRef.current = L.layerGroup().addTo(map)
    heatmapRef.current = L.layerGroup().addTo(map)

    // Add click handler for setting markers
    map.on('click', (e) => {
      if (onLocationClick) {
        onLocationClick(e.latlng.lat, e.latlng.lng)
      }
    })

    mapRef.current = map

    // Force a resize to ensure proper rendering
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }, 100)

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      if (markersRef.current) {
        markersRef.current = null
      }
      if (heatmapRef.current) {
        heatmapRef.current = null
      }
      if (radiusCircleRef.current) {
        radiusCircleRef.current = null
      }
    }
  }, []) // Remove onLocationClick from dependencies to prevent recreation

  // Separate effect for click handler updates
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current
    
    // Remove existing click handlers
    map.off('click')
    
    // Add new click handler
    map.on('click', (e) => {
      if (onLocationClick) {
        onLocationClick(e.latlng.lat, e.latlng.lng)
      }
    })
  }, [onLocationClick])
  const generateHeatmapData = (centerLat: number, centerLng: number) => {
    const heatmapData = []
    const gridSize = 0.005 // Approximately 500m spacing
    const range = 0.02 // About 2km range
    
    for (let lat = centerLat - range; lat <= centerLat + range; lat += gridSize) {
      for (let lng = centerLng - range; lng <= centerLng + range; lng += gridSize) {
        // Simulate higher pollution near main roads (simplified)
        const distanceFromCenter = Math.sqrt(
          Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2)
        )
        
        // Random pollution value with higher values near center (simulating urban density)
        const baseIntensity = Math.max(0, 1 - (distanceFromCenter / range))
        const intensity = baseIntensity * (0.3 + Math.random() * 0.7)
        
        if (intensity > 0.2) {
          heatmapData.push({
            lat,
            lng,
            intensity: intensity
          })
        }
      }
    }
    
    return heatmapData
  }

  // Create heatmap visualization
  const createHeatmap = (data: Array<{lat: number, lng: number, intensity: number}>) => {
    if (!heatmapRef.current) return

    heatmapRef.current.clearLayers()

    data.forEach(point => {
      const color = point.intensity > 0.7 ? '#dc2626' : 
                   point.intensity > 0.4 ? '#f59e0b' : '#22c55e'
      
      const circle = L.circle([point.lat, point.lng], {
        radius: 100,
        fillColor: color,
        fillOpacity: 0.3,
        color: color,
        weight: 1,
        opacity: 0.6
      })
      
      circle.bindPopup(`
        <div>
          <strong>Luftqualität</strong><br>
          Belastung: ${Math.round(point.intensity * 100)}%<br>
          <small>Simulierte Daten</small>
        </div>
      `)
      
      heatmapRef.current!.addLayer(circle)
    })
  }

  useEffect(() => {
    if (!mapRef.current || !qualityScore) return

    const map = mapRef.current

    // Clear existing markers and circles safely
    if (markersRef.current) {
      markersRef.current.clearLayers()
    }
    if (radiusCircleRef.current) {
      map.removeLayer(radiusCircleRef.current)
      radiusCircleRef.current = null
    }

    // Add main marker for the searched/clicked location
    const mainMarker = L.marker([qualityScore.lat, qualityScore.lng])
    
    // Create popup content
    const popupContent = `
      <div class="quality-popup">
        <h3 class="font-bold text-lg mb-2">${qualityScore.address}</h3>
        <div class="quality-score text-blue-600">
          Gesamtbewertung: ${qualityScore.overall}/10
        </div>
        <div class="quality-details">
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>Kindergärten: ${qualityScore.kindergarten}/10</div>
            <div>Schulen: ${qualityScore.schools}/10</div>
            <div>Supermärkte: ${qualityScore.supermarkets}/10</div>
            <div>Ärzte: ${qualityScore.doctors}/10</div>
            <div>Apotheken: ${qualityScore.pharmacies}/10</div>
            <div>Lärm: ${qualityScore.noise}/10</div>
            <div>Verkehr: ${qualityScore.traffic}/10</div>
          </div>
        </div>
      </div>
    `
    
    mainMarker.bindPopup(popupContent).openPopup()
    if (markersRef.current) {
      markersRef.current.addLayer(mainMarker)
    }

    // Add radius circle based on selected transport mode
    const currentRadius = radiusSettings[radiusSettings.activeRadius]
    const circleColor = radiusSettings.activeRadius === 'walking' ? '#22c55e' : 
                       radiusSettings.activeRadius === 'cycling' ? '#3b82f6' : '#f59e0b'
    
    radiusCircleRef.current = L.circle([qualityScore.lat, qualityScore.lng], {
      radius: currentRadius,
      fillColor: circleColor,
      fillOpacity: 0.1,
      color: circleColor,
      weight: 2,
      opacity: 0.6
    })
    
    radiusCircleRef.current.addTo(map)

    // Add amenity markers if available
    if (qualityScore.amenities && markersRef.current) {
      const addMarkersForCategory = (
        categoryKey: string,
        amenities: Array<{lat: number, lng: number, name: string, type?: string}>,
        icon: L.DivIcon,
        label: string
      ) => {
        // Check if category is visible (default to true if not specified)
        if (categoryVisibility[categoryKey] === false) return
        
        amenities?.forEach(amenity => {
          const marker = L.marker([amenity.lat, amenity.lng], { icon })
          marker.bindPopup(`<strong>${label}</strong><br>${amenity.name}${amenity.type ? `<br><small>${amenity.type}</small>` : ''}`)
          markersRef.current!.addLayer(marker)
        })
      }

      // Add all categories with visibility check
      addMarkersForCategory('kindergarten', qualityScore.amenities.kindergartens, amenityIcons.kindergarten, 'Kindergarten')
      addMarkersForCategory('schools', qualityScore.amenities.schools, amenityIcons.school, 'Schule')
      addMarkersForCategory('education', qualityScore.amenities.education, amenityIcons.education, 'Hochschule')
      addMarkersForCategory('supermarkets', qualityScore.amenities.supermarkets, amenityIcons.supermarket, 'Supermarkt')
      addMarkersForCategory('doctors', qualityScore.amenities.doctors, amenityIcons.doctor, 'Arzt/Krankenhaus')
      addMarkersForCategory('pharmacies', qualityScore.amenities.pharmacies, amenityIcons.pharmacy, 'Apotheke')
      addMarkersForCategory('culture', qualityScore.amenities.culture, amenityIcons.culture, 'Kultur')
      addMarkersForCategory('sports', qualityScore.amenities.sports, amenityIcons.sports, 'Sport')
      addMarkersForCategory('parks', qualityScore.amenities.parks, amenityIcons.parks, 'Park')
      addMarkersForCategory('transport', qualityScore.amenities.transport, amenityIcons.transport, 'ÖPNV')
      addMarkersForCategory('restaurants', qualityScore.amenities.restaurants, amenityIcons.restaurants, 'Restaurant')
      addMarkersForCategory('shopping', qualityScore.amenities.shopping, amenityIcons.shopping, 'Einkaufen')
      addMarkersForCategory('finance', qualityScore.amenities.finance, amenityIcons.finance, 'Finanzen')
      addMarkersForCategory('safety', qualityScore.amenities.safety, amenityIcons.safety, 'Sicherheit')
      addMarkersForCategory('services', qualityScore.amenities.services, amenityIcons.services, 'Service')
    }

    // Add heatmap if requested
    if (showHeatmap) {
      const heatmapData = generateHeatmapData(qualityScore.lat, qualityScore.lng)
      createHeatmap(heatmapData)
    } else if (heatmapRef.current) {
      heatmapRef.current.clearLayers()
    }
    
    // Center map on the marker with a slight delay to ensure proper rendering
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.setView([qualityScore.lat, qualityScore.lng], 15)
        mapRef.current.invalidateSize()
      }
    }, 100)
  }, [qualityScore, radiusSettings, showHeatmap, categoryVisibility])

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg"
      style={{ 
        minHeight: '400px',
        position: 'relative',
        zIndex: 1
      }}
    />
  )
}
