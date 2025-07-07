'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center text-gray-500">Karte wird geladen...</div>
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

interface MapWrapperProps {
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

export default function MapWrapper(props: MapWrapperProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div className="h-96 w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center text-gray-500">Karte wird geladen...</div>
  }

  return <Map {...props} />
}
