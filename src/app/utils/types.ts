 export type RadiusSettings = {
    walking: number
    cycling: number
    driving: number
    activeRadius: 'walking' | 'cycling' | 'driving'
  }

  export type ActiveCategories = {
    bildung: boolean
    gesundheit: boolean
    freizeit: boolean
    infrastruktur: boolean
    alltag: boolean
    [key: string]: string | boolean
  }

 export interface QualityScore {
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
    cycling: number
    restaurants: number
    shopping: number
    finance: number
    safety: number
    services: number
    education: number
    hairdresser: number
    noise: number
    traffic: number
    address: string
    lat: number
    lng: number
    bundesland?: string | null
    lebenszufriedenheit?: number | null
    klimadaten?: {temperatur: number, niederschlag: number, sonnenschein: number} | null
    klimaScore?: number
    temperatur?: number
    niederschlag?: number
    sonnenschein?: number
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
      cycling: Array<{lat: number, lng: number, name: string, type: string}>
      restaurants: Array<{lat: number, lng: number, name: string, type: string}>
      shopping: Array<{lat: number, lng: number, name: string, type: string}>
      finance: Array<{lat: number, lng: number, name: string, type: string}>
      safety: Array<{lat: number, lng: number, name: string, type: string}>
      services: Array<{lat: number, lng: number, name: string, type: string}>
      education: Array<{lat: number, lng: number, name: string, type: string}>
      hairdresser: Array<{lat: number, lng: number, name: string, type: string}>
    }
  }
  
 export interface CategoryItem {
    key: string
    label: string
    weight: number
    enabled: boolean
  }
  
 export interface CategoryGroup {
    title: string
    icon: string
    weight: number
    order: number
    categories: CategoryItem[]
    isOpen: boolean
    enabled: boolean
  }

  export interface MapWrapperProps {
    qualityScore: QualityScore | null
    onLocationClick?: (lat: number, lng: number) => void
    radiusSettings?: {
      walking: number
      cycling: number  
      driving: number
      activeRadius: 'walking' | 'cycling' | 'driving'
    }
    categoryVisibility?: {[key: string]: boolean}
  }
  