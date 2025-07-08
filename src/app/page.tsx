'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import SettingsModal from '@/components/SettingsModal'
import InfoModal from '@/components/InfoModal'
import Tooltip from '@/components/Tooltip'

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/MapWrapper'), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-200 animate-pulse rounded-lg"></div>
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

interface CategoryItem {
  key: string
  label: string
  weight: number
  enabled: boolean
}

interface CategoryGroup {
  title: string
  icon: string
  weight: number
  order: number
  categories: CategoryItem[]
  isOpen: boolean
  enabled: boolean
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lebensqualitäts-Karte wird geladen...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

function HomeContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [mapLoading, setMapLoading] = useState(false)
  const [recalculatingScore, setRecalculatingScore] = useState(false)
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null)
  const [error, setError] = useState('')
  const [showEnviromentData, setShowEnviromentData] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  
  // Mobile Detection (verbessert)
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = typeof window !== 'undefined' ? navigator.userAgent : ''
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i
      const isMobileDevice = mobileRegex.test(userAgent) || window.innerWidth <= 768
      setIsMobile(isMobileDevice)
      console.log('Mobile Detection:', isMobileDevice, userAgent) // Debug
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [])
  
  const [radiusSettings, setRadiusSettings] = useState({
    walking: 500,     // 500m walking distance
    cycling: 1500,    // 1.5km cycling distance
    driving: 3000,    // 3km driving distance
    activeRadius: 'walking' as 'walking' | 'cycling' | 'driving'
  })

  // Kategorien-Gruppen mit Gewichtung und Reihenfolge
  const [categoryGroups, setCategoryGroups] = useState<{[key: string]: CategoryGroup}>({
    bildung: {
      title: 'Bildung',
      icon: '🎓',
      weight: 1.0,
      order: 1,
      categories: [
        { key: 'kindergarten', label: 'Kindergärten', weight: 1.0, enabled: true },
        { key: 'schools', label: 'Schulen', weight: 1.2, enabled: true },
        { key: 'education', label: 'Hochschulen', weight: 0.8, enabled: true }
      ],
      isOpen: true,
      enabled: true
    },
    gesundheit: {
      title: 'Gesundheit', 
      icon: '🏥',
      weight: 1.1,
      order: 2,
      categories: [
        { key: 'doctors', label: 'Ärzte', weight: 1.2, enabled: true },
        { key: 'pharmacies', label: 'Apotheken', weight: 1.0, enabled: true }
      ],
      isOpen: true,
      enabled: true
    },
    freizeit: {
      title: 'Freizeit',
      icon: '🎭', 
      weight: 0.9,
      order: 3,
      categories: [
        { key: 'culture', label: 'Kultur', weight: 0.8, enabled: true },
        { key: 'sports', label: 'Sport', weight: 1.0, enabled: true },
        { key: 'parks', label: 'Parks', weight: 1.1, enabled: true },
        { key: 'restaurants', label: 'Restaurants', weight: 0.8, enabled: true }
      ],
      isOpen: true,
      enabled: true
    },
    infrastruktur: {
      title: 'Infrastruktur',
      icon: '🚌',
      weight: 1.0,
      order: 4,
      categories: [
        { key: 'transport', label: 'ÖPNV', weight: 1.2, enabled: true },
        { key: 'cycling', label: 'Fahrradwege', weight: 1.0, enabled: true }
      ],
      isOpen: true,
      enabled: true
    },
    alltag: {
      title: 'Alltag',
      icon: '🛒',
      weight: 1.0,
      order: 5,
      categories: [
        { key: 'supermarkets', label: 'Supermärkte', weight: 1.2, enabled: true },
        { key: 'shopping', label: 'Shopping', weight: 0.8, enabled: true },
        { key: 'finance', label: 'Banken', weight: 0.8, enabled: true },
        { key: 'safety', label: 'Sicherheit', weight: 1.1, enabled: true },
        { key: 'services', label: 'Services', weight: 0.8, enabled: true },
        { key: 'hairdresser', label: 'Friseur', weight: 0.8, enabled: true }
      ],
      isOpen: true,
      enabled: true
    }
  })

  // State für aufgeklappte Gruppen
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({
    bildung: false,
    gesundheit: false,
    freizeit: false,
    infrastruktur: false,
    alltag: false
  })

  // State für Bearbeiten-Modus der Gruppen
  const [editingGroups, setEditingGroups] = useState<{[key: string]: boolean}>({
    bildung: false,
    gesundheit: false,
    freizeit: false,
    infrastruktur: false,
    alltag: false
  })

  // Berechne categoryVisibility basierend auf categoryGroups
  const categoryVisibility = Object.values(categoryGroups).reduce((acc, group) => {
    if (group.enabled) {
      group.categories.forEach(cat => {
        acc[cat.key] = cat.enabled
      })
    } else {
      // Wenn Gruppe deaktiviert ist, alle Kategorien deaktivieren
      group.categories.forEach(cat => {
        acc[cat.key] = false
      })
    }
    return acc
  }, {} as {[key: string]: boolean})

  // Update quality score when radius changes
  useEffect(() => {
    if (qualityScore) {
      calculateQualityScore(qualityScore.lat, qualityScore.lng, qualityScore.address)
    }
  }, [radiusSettings.activeRadius, radiusSettings.walking, radiusSettings.cycling, radiusSettings.driving]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update quality score when category settings change
  useEffect(() => {
    if (qualityScore) {
      setRecalculatingScore(true)
      // Lokale Neuberechnung anstatt API-Call
      const timer = setTimeout(() => {
        const recalculatedScore = recalculateScoreLocally(qualityScore)
        // Nur State aktualisieren wenn sich der Score tatsächlich geändert hat
        if (recalculatedScore.overall !== qualityScore.overall) {
          setQualityScore(recalculatedScore)
        }
        setRecalculatingScore(false)
      }, 150) // Kürzere Verzögerung für lokale Berechnung
      
      return () => clearTimeout(timer)
    }
  }, [categoryGroups]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSettingsSave = (newSettings: any) => {
    setRadiusSettings(newSettings)
  }

  const handleLocationClick = useCallback(async (lat: number, lng: number) => {
    setLoading(true)
    setError('')
    
    try {
      // Reverse geocoding to get address
      const reverseResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: {
          'User-Agent': 'LebensqualitaetsKarte/1.0',
        },
      })
      
      const reverseData = await reverseResponse.json()
      const clickedAddress = reverseData.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      
      setAddress(clickedAddress)
      
      // Calculate quality score
      await calculateQualityScore(lat, lng, clickedAddress)
    } catch (err) {
      setError('Fehler beim Laden der Daten für diesen Ort')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const calculateQualityScore = useCallback(async (lat: number, lng: number, addressName: string) => {
    setMapLoading(true)
    
    try {
      const currentRadius = radiusSettings[radiusSettings.activeRadius]
      
      const scoreResponse = await fetch('/api/quality-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: lat,
          lng: lng,
          address: addressName,
          radius: currentRadius,
          categoryGroups: categoryGroups,
          categoryVisibility: categoryVisibility
        })
      })

      const scoreData = await scoreResponse.json()
      
      if (scoreData.error) {
        setError(scoreData.error)
        return
      }

      setQualityScore(scoreData)
      
      // URL aktualisieren nach erfolgreicher Analyse
      if (addressName) {
        updateURL(addressName)
        console.log('URL updated after quality score calculation:', addressName)
      }
    } finally {
      setMapLoading(false)
      setRecalculatingScore(false)
    }
  }, [radiusSettings, categoryGroups, categoryVisibility]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) return

    setLoading(true)
    setError('')

    try {
      // Geocoding API call
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      // Calculate quality score
      await calculateQualityScore(data.lat, data.lng, address)
      
      // URL aktualisieren nach erfolgreicher Adresseingabe
      updateURL(address)
      console.log('URL updated after address submission:', address)
    } catch (err) {
      setError('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation wird von diesem Browser nicht unterstützt')
      return
    }

    setLoading(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Reverse geocoding to get address
          const reverseResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: {
              'User-Agent': 'LebensqualitaetsKarte/1.0',
            },
          })
          
          const reverseData = await reverseResponse.json()
          const currentAddress = reverseData.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          
          setAddress(currentAddress)
          
          // Calculate quality score
          await calculateQualityScore(latitude, longitude, currentAddress)
        } catch (err) {
          setError('Fehler beim Laden der Daten für Ihren Standort')
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        setLoading(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Standortzugriff wurde verweigert. Bitte erlauben Sie den Zugriff auf Ihren Standort.')
            break
          case error.POSITION_UNAVAILABLE:
            setError('Standortinformationen sind nicht verfügbar.')
            break
          case error.TIMEOUT:
            setError('Zeitüberschreitung bei der Standortabfrage.')
            break
          default:
            setError('Ein unbekannter Fehler ist bei der Standortabfrage aufgetreten.')
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 Minuten Cache
      }
    )
  }

  // URL-Parameter Management mit Meta-Tag Updates
  const updateURL = useCallback((address: string) => {
    if (typeof window === 'undefined') return // SSR check
    
    try {
      if (address) {
        const cleanAddress = address.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
        const newUrl = `${window.location.origin}${window.location.pathname}?ort=${encodeURIComponent(address)}#${cleanAddress}`
        
        // Direkte URL-Aktualisierung
        window.history.replaceState(null, '', newUrl)
        console.log('URL updated to:', newUrl)
        
        // Aktualisiere den Seitentitel
        document.title = `Lebensqualität in ${address} - Lebensqualitäts-Karte`
        
        // Aktualisiere Meta-Tags für Social Sharing
        updateMetaTags(address)
      } else {
        const newUrl = `${window.location.origin}${window.location.pathname}`
        window.history.replaceState(null, '', newUrl)
        console.log('URL reset to:', newUrl)
        document.title = 'Lebensqualitäts-Karte - Entdecke die Lebensqualität in deiner Stadt'
        
        // Reset Meta-Tags
        updateMetaTags(null)
      }
    } catch (error) {
      console.error('Error updating URL:', error)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update Meta Tags für Social Sharing
  const updateMetaTags = useCallback((address: string | null) => {
    if (typeof window === 'undefined') return
    
    try {
      // OG Title
      const ogTitle = document.querySelector('meta[property="og:title"]')
      const title = address 
        ? `Lebensqualität in ${address} - Lebensqualitäts-Karte`
        : 'Lebensqualitäts-Karte - Entdecke die Lebensqualität in deiner Stadt'
      
      if (ogTitle) {
        ogTitle.setAttribute('content', title)
      } else {
        const newOgTitle = document.createElement('meta')
        newOgTitle.setAttribute('property', 'og:title')
        newOgTitle.setAttribute('content', title)
        document.head.appendChild(newOgTitle)
      }
      
      // OG Description
      const ogDescription = document.querySelector('meta[property="og:description"]')
      const description = address
        ? `🍀 Entdecke die Lebensqualität in ${address}! Bewertung basierend auf Bildung, Gesundheit, Freizeit und Infrastruktur.`
        : '🍀 Interaktive Karte zur Bewertung der Lebensqualität basierend auf Bildung, Gesundheit, Freizeit und Infrastruktur.'
      
      if (ogDescription) {
        ogDescription.setAttribute('content', description)
      } else {
        const newOgDescription = document.createElement('meta')
        newOgDescription.setAttribute('property', 'og:description')
        newOgDescription.setAttribute('content', description)
        document.head.appendChild(newOgDescription)
      }
      
      // OG URL
      const ogUrl = document.querySelector('meta[property="og:url"]')
      const currentUrl = window.location.href
      
      if (ogUrl) {
        ogUrl.setAttribute('content', currentUrl)
      } else {
        const newOgUrl = document.createElement('meta')
        newOgUrl.setAttribute('property', 'og:url')
        newOgUrl.setAttribute('content', currentUrl)
        document.head.appendChild(newOgUrl)
      }
      
      // Twitter Title
      const twitterTitle = document.querySelector('meta[name="twitter:title"]')
      if (twitterTitle) {
        twitterTitle.setAttribute('content', title)
      } else {
        const newTwitterTitle = document.createElement('meta')
        newTwitterTitle.setAttribute('name', 'twitter:title')
        newTwitterTitle.setAttribute('content', title)
        document.head.appendChild(newTwitterTitle)
      }
      
      // Twitter Description
      const twitterDescription = document.querySelector('meta[name="twitter:description"]')
      if (twitterDescription) {
        twitterDescription.setAttribute('content', description)
      } else {
        const newTwitterDescription = document.createElement('meta')
        newTwitterDescription.setAttribute('name', 'twitter:description')
        newTwitterDescription.setAttribute('content', description)
        document.head.appendChild(newTwitterDescription)
      }
      
    } catch (error) {
      console.error('Error updating meta tags:', error)
    }
  }, [])

  // Lade Adresse aus URL beim Start
  useEffect(() => {
    const ortParam = searchParams.get('ort')
    if (ortParam && !address && !qualityScore) {
      const decodedAddress = decodeURIComponent(ortParam)
      setAddress(decodedAddress)
      // Automatisch analysieren wenn URL-Parameter vorhanden
      handleAddressSearch(decodedAddress)
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddressSearch = async (searchAddress: string = address) => {
    if (!searchAddress.trim()) return
    
    console.log('Updating URL for address:', searchAddress) // Debug
    updateURL(searchAddress)
    console.log('New URL:', window.location.href) // Debug
    
    setLoading(true)
    setError('')

    try {
      // Geocoding API call
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(searchAddress)}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      // Calculate quality score
      await calculateQualityScore(data.lat, data.lng, searchAddress)
    } catch (err) {
      setError('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  // Share-Funktionalität - Instagram Story Format (größere Schrift & sichtbare Karte)
  const generateShareImage = async () => {
    if (!qualityScore) return
    
    // Helper function zum Laden von OSM-Kacheln
    const loadMapTile = async (lat: number, lng: number, zoom: number): Promise<HTMLImageElement | null> => {
      try {
        // Berechne Kachel-Koordinaten für bessere Zentrierung
        const tileX = Math.floor((lng + 180) / 360 * Math.pow(2, zoom))
        const tileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
        
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        return new Promise((resolve) => {
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
          // Verwende einen niedrigeren Zoom für bessere Übersicht
          img.src = `https://tile.openstreetmap.org/${Math.min(zoom, 13)}/${tileX}/${tileY}.png`
          
          // Timeout nach 2 Sekunden
          setTimeout(() => resolve(null), 2000)
        })
      } catch (error) {
        console.error('Fehler beim Laden der Karte:', error)
        return null
      }
    }
    
    // Erstelle ein virtuelles Canvas Element im Instagram Story Format (9:16)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = 1080
    canvas.height = 1920
    
    // Hintergrund mit modernem Gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    if (darkMode) {
      gradient.addColorStop(0, '#0f172a')
      gradient.addColorStop(0.5, '#1e293b') 
      gradient.addColorStop(1, '#334155')
    } else {
      gradient.addColorStop(0, '#f0f9ff')
      gradient.addColorStop(0.5, '#e0f2fe')
      gradient.addColorStop(1, '#bae6fd')
    }
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Dekorative Kreise im Hintergrund
    ctx.globalAlpha = 0.08
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const radius = Math.random() * 120 + 40
      
      ctx.fillStyle = darkMode ? '#10b981' : '#0284c7'
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    
    // Hauptcontainer mit glassmorphism Effekt
    const containerPadding = 50
    const containerX = containerPadding
    const containerY = 60
    const containerWidth = canvas.width - (containerPadding * 2)
    const containerHeight = canvas.height - 120
    
    // Glassmorphism Hintergrund
    ctx.fillStyle = darkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.92)'
    ctx.filter = 'blur(0px)'
    roundRect(ctx, containerX, containerY, containerWidth, containerHeight, 32)
    ctx.fill()
    
    // Border für den Container
    ctx.strokeStyle = darkMode ? 'rgba(148, 163, 184, 0.4)' : 'rgba(148, 163, 184, 0.6)'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Header (noch größer und deutlicher)
    ctx.fillStyle = darkMode ? '#ffffff' : '#1f2937'
    ctx.font = 'bold 100px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('🍀', canvas.width / 2, containerY + 120)
    
    ctx.font = 'bold 72px system-ui'
    ctx.fillText('Lebensqualitäts-Analyse', canvas.width / 2, containerY + 220)
    
    // Adresse (größer)
    let displayAddress = qualityScore.address
    if (displayAddress.length > 25) {
      displayAddress = displayAddress.substring(0, 25) + '...'
    }
    
    ctx.font = 'bold 48px system-ui'
    ctx.fillStyle = '#10b981'
    ctx.fillText(displayAddress, canvas.width / 2, containerY + 290)
    
    // Alle Kategorien sammeln und sortieren (früher definiert)
    const allCategories = [
      { label: 'Kindergärten', emoji: '🎓', score: qualityScore.kindergarten },
      { label: 'Schulen', emoji: '🏫', score: qualityScore.schools },
      { label: 'Hochschulen', emoji: '🎓', score: qualityScore.education },
      { label: 'Supermärkte', emoji: '🛒', score: qualityScore.supermarkets },
      { label: 'Ärzte', emoji: '🏥', score: qualityScore.doctors },
      { label: 'Apotheken', emoji: '💊', score: qualityScore.pharmacies },
      { label: 'Kultur', emoji: '🎭', score: qualityScore.culture },
      { label: 'Sport', emoji: '⚽', score: qualityScore.sports },
      { label: 'Parks', emoji: '🌳', score: qualityScore.parks },
      { label: 'ÖPNV', emoji: '🚌', score: qualityScore.transport },
      { label: 'Fahrradwege', emoji: '🚲', score: qualityScore.cycling },
      { label: 'Restaurants', emoji: '🍽️', score: qualityScore.restaurants }
    ].sort((a, b) => b.score - a.score)
    
    // Top 3 und Flop 3
    const topCategories = allCategories.slice(0, 3)
    const flopCategories = allCategories.slice(-3).reverse()
    
    // Top-Kategorien starten später (nach dem Score)
    const topStartY = containerY + 600
    
    // Score Circle zwischen Ortsname und TOP 3 (größer)
    const scoreCenterX = canvas.width / 2
    const scoreCenterY = containerY + 410
    const scoreRadius = 90
    
    // Score-Kreis mit Gradient und Schatten
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 25
    ctx.shadowOffsetY = 12
    
    const scoreGradient = ctx.createRadialGradient(scoreCenterX, scoreCenterY, 0, scoreCenterX, scoreCenterY, scoreRadius)
    const score = qualityScore.overall
    if (score >= 8) {
      scoreGradient.addColorStop(0, '#10b981')
      scoreGradient.addColorStop(1, '#059669')
    } else if (score >= 6) {
      scoreGradient.addColorStop(0, '#f59e0b')
      scoreGradient.addColorStop(1, '#d97706')
    } else {
      scoreGradient.addColorStop(0, '#ef4444')
      scoreGradient.addColorStop(1, '#dc2626')
    }
    
    ctx.fillStyle = scoreGradient
    ctx.beginPath()
    ctx.arc(scoreCenterX, scoreCenterY, scoreRadius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()
    
    // Score-Text (zentriert im Kreis)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 80px system-ui'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = 6
    ctx.fillText(Math.round(score).toString(), scoreCenterX, scoreCenterY )
    
    ctx.shadowColor = 'transparent'
    ctx.font = 'bold 32px system-ui'
    ctx.fillStyle = darkMode ? '#e2e8f0' : '#c8ced7'
    ctx.fillText('von 10', scoreCenterX, scoreCenterY + 35)
    ctx.fillStyle = darkMode ? '#10b981' : '#059669'
    ctx.font = 'bold 48px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('🏆 TOP 3', canvas.width / 2, topStartY)
    
    topCategories.forEach((cat, index) => {
      const y = topStartY + 80 + (index * 80)
      const itemX = containerX + 50
      const itemWidth = containerWidth - 100
      
      // Item Background
      ctx.fillStyle = darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'
      roundRect(ctx, itemX, y - 35, itemWidth, 70, 16)
      ctx.fill()
      
      // Emoji (größer und vollständig sichtbar)
      ctx.save()
      ctx.globalAlpha = 1.0
      ctx.font = '48px system-ui'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#000000'
      ctx.fillText(cat.emoji, itemX + 30, y + 15)
      ctx.restore()
      
      // Score Badge (größer)
      ctx.fillStyle = '#10b981'
      roundRect(ctx, itemX + itemWidth - 90, y - 25, 70, 50, 25)
      ctx.fill()
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 32px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(cat.score.toString(), itemX + itemWidth - 55, y + 8)
      
      // Label (größer)
      ctx.fillStyle = darkMode ? '#ffffff' : '#000000'
      ctx.font = 'bold 36px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(cat.label, itemX + 110, y + 12)
    })
    
    // Flop-Kategorien (größer)
    const flopStartY = topStartY + 380
    ctx.fillStyle = darkMode ? '#ef4444' : '#dc2626'
    ctx.font = 'bold 48px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('📉 FLOP 3', canvas.width / 2, flopStartY)
    
    flopCategories.forEach((cat, index) => {
      const y = flopStartY + 80 + (index * 80)
      const itemX = containerX + 50
      const itemWidth = containerWidth - 100
      
      // Item Background
      ctx.fillStyle = darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'
      roundRect(ctx, itemX, y - 35, itemWidth, 70, 16)
      ctx.fill()
      
      // Emoji (größer und vollständig opaque)
      ctx.save()
      ctx.globalAlpha = 1.0
      ctx.font = '48px system-ui'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#000000'
      ctx.fillText(cat.emoji, itemX + 30, y + 15)
      ctx.restore()
      
      // Score Badge (größer)
      const badgeColor = cat.score >= 5 ? '#f59e0b' : '#ef4444'
      ctx.fillStyle = badgeColor
      roundRect(ctx, itemX + itemWidth - 90, y - 25, 70, 50, 25)
      ctx.fill()
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 32px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(cat.score.toString(), itemX + itemWidth - 55, y + 8)
      
      // Label (größer)
      ctx.fillStyle = darkMode ? '#ffffff' : '#000000'
      ctx.font = 'bold 36px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(cat.label, itemX + 110, y + 12)
    })
    
    // Quadratische Karte links und Call-to-Action rechts
    const mapSize = 280  // Quadratische Größe
    const mapY = flopStartY + 360
    const mapX = containerX + 50  // Links im Container
    
    // Call-to-Action rechts neben der Karte
    const ctaX = mapX + mapSize + 50  // 50px Abstand zur Karte
    const ctaY = mapY + mapSize / 2   // Vertikal zentriert zur Karte
    const ctaWidth = containerWidth - (mapSize + 150)  // Verfügbare Breite rechts
    
    // Call-to-Action Text (mehrzeilig wenn nötig)
    ctx.fillStyle = '#10b981'
    ctx.font = 'bold 32px system-ui'
    ctx.textAlign = 'left'
    
    // Text umbrechen
    const ctaText = '📱 Entdecke die Lebensqualität in deiner Stadt!'
    const words = ctaText.split(' ')
    const maxWidth = ctaWidth
    let line = ''
    let y = ctaY - 20  // Startposition
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' '
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), ctaX, y)
        line = words[i] + ' '
        y += 40
      } else {
        line = testLine
      }
    }    ctx.fillText(line.trim(), ctaX, y)
    
    // Quadratische OSM-Karte (vereinfacht)
    // Versuche echte OSM-Kachel zu laden
    const mapTile = await loadMapTile(qualityScore.lat, qualityScore.lng, 13)
    
    if (mapTile) {
      // Echte OSM-Karte zeichnen (quadratisch)
      ctx.save()
      
      // Clip auf abgerundetes Quadrat
      roundRect(ctx, mapX, mapY, mapSize, mapSize, 20)
      ctx.clip()
      
      // OSM-Kachel quadratisch einzeichnen 
      ctx.drawImage(mapTile, mapX, mapY, mapSize, mapSize)
      
      ctx.restore()
      
      // Border über die Karte
      ctx.strokeStyle = darkMode ? '#94a3b8' : '#334155'
      ctx.lineWidth = 6
      roundRect(ctx, mapX, mapY, mapSize, mapSize, 20)
      ctx.stroke()
    } else {
      // Fallback: Straßen-Grid wenn OSM nicht lädt
      ctx.fillStyle = darkMode ? '#1e293b' : '#f8fafc'
      roundRect(ctx, mapX, mapY, mapSize, mapSize, 20)
      ctx.fill()
      
      ctx.strokeStyle = darkMode ? '#94a3b8' : '#334155'
      ctx.lineWidth = 6
      roundRect(ctx, mapX, mapY, mapSize, mapSize, 20)
      ctx.stroke()
      
      // Straßen-Grid als Fallback
      ctx.strokeStyle = darkMode ? '#64748b' : '#94a3b8'
      ctx.lineWidth = 8
      
      for (let i = 1; i < 5; i++) {
        const roadY = mapY + (i * mapSize / 5)
        ctx.beginPath()
        ctx.moveTo(mapX + 30, roadY)
        ctx.lineTo(mapX + mapSize - 30, roadY)
        ctx.stroke()
      }
      
      for (let i = 1; i < 5; i++) {
        const roadX = mapX + (i * mapSize / 5)
        ctx.beginPath()
        ctx.moveTo(roadX, mapY + 30)
        ctx.lineTo(roadX, mapY + mapSize - 30)
        ctx.stroke()
      }
    }
    
    // Nur der zentrale Standort-Marker (vereinfacht)
    const centerMapX = mapX + mapSize / 2
    const centerMapY = mapY + mapSize / 2
    
    // Hauptmarker (Standort) - größer und deutlicher mit Schatten
    ctx.save()
    ctx.globalAlpha = 1.0
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 5
    
    ctx.fillStyle = '#ef4444'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(centerMapX, centerMapY, 30, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = 3
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('📍', centerMapX, centerMapY + 10)
    ctx.restore()
    
    // Footer mit "made with love" in weißem Bereich
    ctx.fillStyle = darkMode ? '#64748b' : '#94a3b8'
    ctx.font = '20px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('made with ❤️ from Greifswald', canvas.width / 2, canvas.height - 90)
    
    return canvas.toDataURL('image/png')
  }
  
  // Helper function für rounded rectangles
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  const handleShare = async () => {
    if (!qualityScore) return
    
    try {
      const imageDataUrl = await generateShareImage()
      if (!imageDataUrl) return
      
      // Convert Data URL zu Blob
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()
      
      const shareData = {
        title: `Lebensqualität in ${qualityScore.address}`,
        text: `🍀 Lebensqualitäts-Analyse für ${qualityScore.address}\n\n📊 Gesamtbewertung: ${qualityScore.overall}/10\n\nEntdecke die Lebensqualität in deiner Stadt!`,
        url: window.location.href,
        files: [new File([blob], `lebensqualitaet-${qualityScore.address.replace(/[^a-zA-Z0-9]/g, '-')}.png`, { type: 'image/png' })]
      }
      
      // Prüfe ob Gerät mobiles Teilen unterstützt
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      // Web Share API versuchen
      if (navigator.share) {
        try {
          // Prüfe was unterstützt wird
          if (isMobile) {
            // Mobile: Erst Text+URL teilen
            await navigator.share({
              title: shareData.title,
              text: shareData.text,
              url: shareData.url
            })
            
            // Frage nach Bild-Download
            if (confirm('Möchten Sie auch das Bild herunterladen?')) {
              const link = document.createElement('a')
              link.download = `lebensqualitaet-${qualityScore.address.replace(/[^a-zA-Z0-9]/g, '-')}.png`
              link.href = imageDataUrl
              link.click()
            }
            return
          } else {
            // Desktop: Versuche mit Datei zu teilen
            if (navigator.canShare && navigator.canShare(shareData)) {
              await navigator.share(shareData)
              return
            } else {
              // Fallback: nur Text+URL
              await navigator.share({
                title: shareData.title,
                text: shareData.text,
                url: shareData.url
              })
              
              // Bild separat downloaden
              const link = document.createElement('a')
              link.download = `lebensqualitaet-${qualityScore.address.replace(/[^a-zA-Z0-9]/g, '-')}.png`
              link.href = imageDataUrl
              link.click()
              return
            }
          }
        } catch (shareError) {
          console.log('Web Share API fehlgeschlagen:', shareError)
          // Fallback unten
        }
      }
      
      // Fallback: Download des Bildes + URL kopieren
      const link = document.createElement('a')
      link.download = `lebensqualitaet-${qualityScore.address.replace(/[^a-zA-Z0-9]/g, '-')}.png`
      link.href = imageDataUrl
      link.click()
      
      // URL in Zwischenablage kopieren
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
      } else {
      }
    } catch (error) {
      console.error('Fehler beim Teilen:', error)
      alert('Fehler beim Teilen der Ergebnisse')
    }
  }

  // URL kopieren Funktionalität
  const handleCopyURL = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      // Kurze Benachrichtigung
      const originalTitle = document.title
      document.title = '✓ URL kopiert!'
      setTimeout(() => {
        document.title = originalTitle
      }, 2000)
    } catch (error) {
      console.error('Fehler beim Kopieren der URL:', error)
      // Fallback für ältere Browser
      const textArea = document.createElement('textarea')
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('URL wurde in die Zwischenablage kopiert!')
    }
  }

  // Helper-Funktionen
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  const toggleEditMode = (groupKey: string) => {
    setEditingGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  // Berechne die Gesamtbewertung einer Gruppe
  const getGroupScore = (groupKey: string): number => {
    if (!qualityScore) return 0
    
    const group = categoryGroups[groupKey]
    if (!group || !group.enabled) return 0
    
    let totalScore = 0
    let count = 0
    
    group.categories.forEach(category => {
      if (category.enabled) {
        const score = qualityScore[category.key as keyof QualityScore] as number
        if (typeof score === 'number') {
          totalScore += score
          count++
        }
      }
    })
    
    return count > 0 ? Math.round(totalScore / count) : 0
  }

  // Helper function to count total visible markers
  const getTotalVisibleMarkers = (): number => {
    if (!qualityScore?.amenities) return 0
    
    let total = 0
    const amenityKeys = [
      'kindergartens', 'schools', 'education', 'supermarkets', 'doctors' , 'pharmacies' , 'culture', 'sports', 'parks', 'transport', 'cycling',
      'restaurants', 'shopping', 'finance', 'safety', 'services', 'hairdresser'
    ]
    
    amenityKeys.forEach(key => {
      const categoryKey = key === 'kindergartens' ? 'kindergarten' : 
                         key === 'schools' ? 'schools' :
                         key === 'education' ? 'education' :
                         key === 'supermarkets' ? 'supermarkets' :
                         key === 'doctors' ? 'doctors' :
                         key === 'pharmacies' ? 'pharmacies' :
                         key === 'culture' ? 'culture' :
                         key === 'sports' ? 'sports' :
                         key === 'parks' ? 'parks' :
                         key === 'transport' ? 'transport' :
                         key === 'cycling' ? 'cycling' :
                         key === 'restaurants' ? 'restaurants' :
                         key === 'shopping' ? 'shopping' :
                         key === 'finance' ? 'finance' :
                         key === 'safety' ? 'safety' :
                         key === 'services' ? 'services' :
                         key === 'hairdresser' ? 'hairdresser' : null
      
      if (categoryKey && categoryVisibility[categoryKey] !== false) {
        const amenities = qualityScore.amenities?.[key as keyof typeof qualityScore.amenities]
        total += amenities?.length || 0
      }
    })
    
    return total
  }

  const toggleGroupVisibility = (groupKey: string) => {
    setCategoryGroups(prev => {
      const newEnabled = !prev[groupKey].enabled
      return {
        ...prev,
        [groupKey]: {
          ...prev[groupKey],
          enabled: newEnabled,
          // Wenn Gruppe abgewählt wird, alle Kategorien abwählen
          // Wenn Gruppe angewählt wird, alle Kategorien wieder anwählen
          categories: prev[groupKey].categories.map(cat => ({
            ...cat,
            enabled: newEnabled
          }))
        }
      }
    })
  }

  const toggleCategoryVisibility = (groupKey: string, categoryKey: string) => {
    setCategoryGroups(prev => {
      // Nur toggle erlauben, wenn die Gruppe aktiviert ist
      if (!prev[groupKey].enabled) return prev
      
      return {
        ...prev,
        [groupKey]: {
          ...prev[groupKey],
          categories: prev[groupKey].categories.map(cat => 
            cat.key === categoryKey ? { ...cat, enabled: !cat.enabled } : cat
          )
        }
      }
    })
  }



  const updateCategoryWeight = (groupKey: string, categoryKey: string, weight: number) => {
    setCategoryGroups(prev => ({
      ...prev,
      [groupKey]: {
        ...prev[groupKey],
        categories: prev[groupKey].categories.map(cat => 
          cat.key === categoryKey ? { ...cat, weight } : cat
        )
      }
    }))
  }

  const updateGroupWeight = (groupKey: string, weight: number) => {
    setCategoryGroups(prev => ({
      ...prev,
      [groupKey]: {
        ...prev[groupKey],
        weight
      }
    }))
  }

  const getCategoryColor = (key: string) => {
    const colors: {[key: string]: string} = {
      kindergarten: 'bg-green-500',
      schools: 'bg-blue-500',
      education: 'bg-indigo-600',
      doctors: 'bg-red-500',
      pharmacies: 'bg-purple-500',
      culture: 'bg-pink-500',
      sports: 'bg-orange-500',
      parks: 'bg-emerald-500',
      transport: 'bg-indigo-500',
      cycling: 'bg-green-600',
      supermarkets: 'bg-yellow-500',
      restaurants: 'bg-yellow-600',
      shopping: 'bg-teal-600',
      finance: 'bg-green-700',
      safety: 'bg-red-700',
      services: 'bg-gray-600',
      hairdresser: 'bg-pink-400'
    }
    return colors[key] || 'bg-gray-500'
  }

  // Gewichtungslabels und -werte
  const getWeightLabel = (weight: number) => {
    if (weight === 0.0) return 'deaktiviert'
    if (weight >= 1.2) return 'sehr wichtig'
    if (weight >= 1.1) return 'wichtig'
    if (weight >= 1.0) return 'neutral'
    if (weight >= 0.9) return 'nebensächlich'
    return 'unwichtig'
  }

  const weightOptions = [
    { value: 1.2, label: 'sehr wichtig' },
    { value: 1.1, label: 'wichtig' },
    { value: 1.0, label: 'neutral' },
    { value: 0.9, label: 'nebensächlich' },
    { value: 0.8, label: 'unwichtig' },
    { value: 0.0, label: 'deaktiviert' }
  ]

  // Funktion für farbige Bewertungen basierend auf Score
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-green-500 to-emerald-500'
    if (score >= 6) return 'from-yellow-400 to-green-500'
    if (score >= 4) return 'from-orange-400 to-yellow-500'
    if (score >= 2) return 'from-red-400 to-orange-500'
    return 'from-red-600 to-red-500'
  }

  const getScoreTextColor = (score: number) => {
    if (score >= 6) return 'text-white'
    return 'text-white'
  }

  // Lokale Neuberechnung der Gesamtbewertung basierend auf Kategorienauswahl und Gewichtung
  const recalculateScoreLocally = useCallback((currentScore: QualityScore): QualityScore => {
    let overallScore = 0
    let totalWeight = 0
    
    // Durchlaufe alle Gruppen und Kategorien
    Object.values(categoryGroups).forEach((group) => {
      if (!group.enabled) return
      
      const groupWeight = group.weight || 1.0
      
      group.categories.forEach((category) => {
        if (!category.enabled || !categoryVisibility[category.key]) return
        
        const categoryWeight = category.weight || 1.0
        
        // Ignoriere Kategorien mit Gewichtung 0.0 (deaktiviert)
        if (categoryWeight === 0.0) return
        
        const finalWeight = groupWeight * categoryWeight
        
        // Hole den Score für diese Kategorie aus den vorhandenen Daten
        const score = currentScore[category.key as keyof QualityScore] as number
        
        if (typeof score === 'number') {
          overallScore += score * finalWeight
          totalWeight += finalWeight
        }
      })
    })
    
    // Lärm- und Verkehrsbelastung immer berücksichtigen (als negative Faktoren)
    if (totalWeight > 0) {
      const noisePenalty = (10 - currentScore.noise) * 0.1
      const trafficPenalty = (10 - currentScore.traffic) * 0.1
      overallScore += (noisePenalty + trafficPenalty) * totalWeight
      totalWeight += 0.2 * totalWeight
    }
    
    const newOverallScore = totalWeight > 0 ? Math.round(overallScore / totalWeight) : 0
    
    return {
      ...currentScore,
      overall: Math.max(0, Math.min(10, newOverallScore)) // Begrenze auf 0-10
    }
  }, [categoryGroups, categoryVisibility])

  // Gewichtungspresets basierend auf Zielgruppen
  const weightingPresets = {
    default: {
      name: 'Standard',
      description: 'Ausgewogene Gewichtung für alle Nutzer',
      icon: '⚖️',
      groups: {
        bildung: { weight: 1.0, categories: { kindergarten: 1.0, schools: 1.2, education: 0.8 } },
        gesundheit: { weight: 1.1, categories: { doctors: 1.2, pharmacies: 1.0 } },
        freizeit: { weight: 0.9, categories: { culture: 0.8, sports: 1.0, parks: 1.1, restaurants: 0.8 } },
        infrastruktur: { weight: 1.0, categories: { transport: 1.2, cycling: 1.0 } },
        alltag: { weight: 1.0, categories: { supermarkets: 1.2, shopping: 0.8, finance: 0.8, safety: 1.1, services: 0.8, hairdresser: 0.8 } }
      }
    },
    familien: {
      name: 'Familien mit Kindern',
      description: 'Optimiert für Familien mit schulpflichtigen Kindern',
      icon: '👨‍👩‍👧‍👦',
      groups: {
        bildung: { weight: 1.2, categories: { kindergarten: 1.2, schools: 1.2, education: 0.8 } },
        gesundheit: { weight: 1.1, categories: { doctors: 1.2, pharmacies: 1.0 } },
        freizeit: { weight: 1.0, categories: { culture: 0.8, sports: 1.0, parks: 1.2, restaurants: 0.8 } },
        infrastruktur: { weight: 1.0, categories: { transport: 1.1, cycling: 1.1 } },
        alltag: { weight: 1.1, categories: { supermarkets: 1.2, shopping: 0.8, finance: 0.8, safety: 1.2, services: 0.8, hairdresser: 0.8 } }
      }
    },
    berufstaetige: {
      name: 'Berufstätige ohne Kinder',
      description: 'Fokus auf Mobilität und Freizeitangebote',
      icon: '🧑‍💼',
      groups: {
        bildung: { weight: 0.8, categories: { kindergarten: 0.8, schools: 0.8, education: 0.9 } },
        gesundheit: { weight: 1.0, categories: { doctors: 1.1, pharmacies: 1.0 } },
        freizeit: { weight: 1.1, categories: { culture: 1.1, sports: 1.1, parks: 1.0, restaurants: 1.1 } },
        infrastruktur: { weight: 1.2, categories: { transport: 1.2, cycling: 1.1 } },
        alltag: { weight: 1.0, categories: { supermarkets: 1.1, shopping: 1.0, finance: 0.9, safety: 1.0, services: 0.9, hairdresser: 0.9 } }
      }
    },
    senioren: {
      name: 'Senioren',
      description: 'Schwerpunkt auf Gesundheit und Grundversorgung',
      icon: '👴👵',
      groups: {
        bildung: { weight: 0.8, categories: { kindergarten: 0.8, schools: 0.8, education: 0.8 } },
        gesundheit: { weight: 1.2, categories: { doctors: 1.2, pharmacies: 1.2 } },
        freizeit: { weight: 1.0, categories: { culture: 1.0, sports: 0.9, parks: 1.1, restaurants: 0.9 } },
        infrastruktur: { weight: 1.2, categories: { transport: 1.2, cycling: 0.8 } },
        alltag: { weight: 1.1, categories: { supermarkets: 1.2, shopping: 0.8, finance: 1.0, safety: 1.1, services: 1.0, hairdresser: 0.9 } }
      }
    },
    studenten: {
      name: 'Studenten',
      description: 'Bildung, Mobilität und günstiges Leben',
      icon: '🎓',
      groups: {
        bildung: { weight: 1.2, categories: { kindergarten: 0.8, schools: 0.8, education: 1.2 } },
        gesundheit: { weight: 1.0, categories: { doctors: 1.0, pharmacies: 1.0 } },
        freizeit: { weight: 1.1, categories: { culture: 1.1, sports: 1.0, parks: 1.0, restaurants: 1.1 } },
        infrastruktur: { weight: 1.2, categories: { transport: 1.2, cycling: 1.2 } },
        alltag: { weight: 1.0, categories: { supermarkets: 1.1, shopping: 0.8, finance: 0.8, safety: 1.0, services: 0.8, hairdresser: 0.8 } }
      }
    }
  }

  const [selectedPreset, setSelectedPreset] = useState<string>('default')

  // Funktion zum Anwenden eines Presets
  const applyPreset = (presetKey: string) => {
    const preset = weightingPresets[presetKey as keyof typeof weightingPresets]
    if (!preset) return

    const newCategoryGroups = { ...categoryGroups }
    
    // Alle Kategorien-Gruppen durchgehen
    Object.entries(preset.groups).forEach(([groupKey, groupData]) => {
      if (newCategoryGroups[groupKey]) {
        // Gruppengewichtung setzen
        newCategoryGroups[groupKey].weight = groupData.weight
        
        // Kategoriengewichtungen setzen
        Object.entries(groupData.categories).forEach(([categoryKey, categoryWeight]) => {
          const categoryIndex = newCategoryGroups[groupKey].categories.findIndex(c => c.key === categoryKey)
          if (categoryIndex !== -1) {
            newCategoryGroups[groupKey].categories[categoryIndex].weight = categoryWeight
          }
        })
      }
    })

    setCategoryGroups(newCategoryGroups)
    setSelectedPreset(presetKey)
  }

  // Funktion zum Zurücksetzen auf Standard-Preset
  const resetToDefault = () => {
    applyPreset('default')
  }

  // Funktion zum Erkennen des aktuellen Presets basierend auf Gewichtungen
  const detectCurrentPreset = () => {
    for (const [key, preset] of Object.entries(weightingPresets)) {
      let matches = true
      
      // Prüfe alle Gruppengewichtungen
      for (const [groupKey, groupData] of Object.entries(preset.groups)) {
        if (!categoryGroups[groupKey] || Math.abs(categoryGroups[groupKey].weight - groupData.weight) > 0.01) {
          matches = false
          break
        }
        
        // Prüfe alle Kategoriengewichtungen
        for (const [categoryKey, categoryWeight] of Object.entries(groupData.categories)) {
          const category = categoryGroups[groupKey].categories.find(c => c.key === categoryKey)
          if (!category || Math.abs(category.weight - categoryWeight) > 0.01) {
            matches = false
            break
          }
        }
        
        if (!matches) break
      }
      
      if (matches) {
        return key
      }
    }
    
    return 'custom' // Benutzerdefinierte Gewichtungen
  }

  // Aktualisiere den Preset-Status bei Änderungen
  useEffect(() => {
    const currentPreset = detectCurrentPreset()
    if (currentPreset !== selectedPreset) {
      setSelectedPreset(currentPreset)
    }
  }, [categoryGroups]) // eslint-disable-line react-hooks/exhaustive-deps

  const getCategoryExamples = (categoryKey: string): string => {
    const examples = {
      kindergarten: 'Kindergärten, Kindertagesstätten, Vorschulen',
      schools: 'Grundschulen, weiterführende Schulen, Gymnasien',
      education: 'Universitäten, Hochschulen, Fachhochschulen',
      supermarkets: 'Supermärkte, Lebensmittelgeschäfte, Discounter',
      doctors: 'Arztpraxen, Krankenhäuser, medizinische Zentren',
      pharmacies: 'Apotheken, Sanitätshäuser',
      culture: 'Museen, Theater, Bibliotheken, Kinos, Galerien, Kunsthäuser',
      sports: 'Fitnessstudios, Schwimmbäder, Sporthallen, Tennisplätze, Calisthenics-Parks, Kletterhallen',
      parks: 'Parkanlagen, Spielplätze, Gärten, Erholungsgebiete',
      transport: 'Bushaltestellen, Bahnhöfe, U-Bahn-Stationen',
      cycling: 'Fahrradwege, Fahrradspuren, Radverleih, Reparaturstationen',
      restaurants: 'Restaurants, Cafés, Bars, Fast-Food',
      shopping: 'Bäckereien, Metzgereien, Bekleidungsgeschäfte, Einkaufszentren',
      finance: 'Banken, Geldautomaten, Finanzdienstleister',
      safety: 'Polizeistationen, Feuerwachen',
      services: 'Poststellen, Tankstellen',
      hairdresser: 'Friseure, Kosmetikstudios, Beautysalons'
    }
    return examples[categoryKey as keyof typeof examples] || 'Verschiedene Einrichtungen'
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' 
        : 'bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="text-center mb-8 lg:mb-12">
          <div className="flex justify-center items-center gap-4 mb-4">
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 ${
              darkMode 
                ? 'bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent'
            }`}>
              Lebensqualitäts-Karte
            </h1>
            <div className="flex gap-2">
              <Tooltip 
                content="Informationen über das Bewertungssystem und häufige Fragen" 
                darkMode={darkMode}
                position="bottom"
              >
                <button
                  onClick={() => setShowInfo(true)}
                  className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                    darkMode 
                      ? 'bg-slate-700 hover:bg-slate-600 text-blue-400' 
                      : 'bg-white/80 hover:bg-white text-blue-600 hover:text-blue-700'
                  } shadow-lg`}
                  aria-label="Informationen anzeigen"
                >
                  <span className="text-xl">ℹ️</span>
                </button>
              </Tooltip>
              <Tooltip 
                content={darkMode ? 'Zum hellen Modus wechseln' : 'Zum dunklen Modus wechseln'} 
                darkMode={darkMode}
                position="bottom"
              >
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                    darkMode 
                      ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400' 
                      : 'bg-white/80 hover:bg-white text-gray-600 hover:text-yellow-500'
                  } shadow-lg`}
                  aria-label={darkMode ? 'Light Mode' : 'Dark Mode'}
                >
                  <span className="text-xl">{darkMode ? '☀️' : '🌙'}</span>
                </button>
              </Tooltip>
            </div>
          </div>
          <p className={`text-sm sm:text-base max-w-2xl mx-auto ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Entdecke die Lebensqualität an jedem Ort - von Bildung bis Freizeit, alles auf einen Blick
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Address Input */}
          <div className={`rounded-2xl shadow-xl border p-6 lg:p-8 backdrop-blur-sm transition-colors duration-300 ${
            darkMode 
              ? 'bg-slate-800/80 border-slate-600/30' 
              : 'bg-white/80 border-white/20'
          }`}>
            <div className="mb-6">
              <label className={`block text-lg font-medium mb-3 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                📍 Adresse oder Ort eingeben
              </label>
            </div>
            <form onSubmit={handleAddressSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <div className="flex-1 min-w-0 w-full">
                <Tooltip content="Geben Sie eine Adresse oder einen Ort ein (z.B. 'Alexanderplatz, Berlin' oder 'München Marienplatz') oder klicken Sie auf die Karte." darkMode={darkMode} className="block w-full">
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="z.B. Alexanderplatz, Berlin oder klicke auf die Karte"
                      className={`w-full px-6 py-4 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-lg ${
                        darkMode 
                          ? 'bg-slate-700/80 border-slate-600 text-white placeholder-gray-400' 
                          : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    {address && (
                      <Tooltip content="Eingabefeld leeren" darkMode={darkMode}>
                        <button
                          type="button"
                          onClick={() => setAddress('')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                            darkMode 
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-slate-600' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                          aria-label="Eingabe löschen"
                        >
                          <span className="text-lg">✕</span>
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </Tooltip>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Tooltip content="Verwendet die GPS-Funktion Ihres Geräts, um Ihren aktuellen Standort zu ermitteln." darkMode={darkMode}>
                  <button
                    type="button"
                    onClick={handleCurrentLocation}
                    disabled={loading}
                    className={`px-4 py-4 rounded-xl border transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed ${
                      darkMode 
                        ? 'bg-slate-700/80 border-slate-600 text-gray-200 hover:bg-slate-600/80' 
                        : 'bg-white/80 border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                    title="Meinen aktuellen Standort verwenden"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                    ) : (
                      <span className="text-xl">📍</span>
                    )}
                  </button>
                </Tooltip>
                <Tooltip content="Analysiert die eingegebene Adresse und berechnet die Lebensqualitäts-Bewertung basierend auf nahegelegenen Einrichtungen." darkMode={darkMode}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none text-lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Laden...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>🔍</span>
                        <span>Bewerten</span>
                      </div>
                    )}
                  </button>
                </Tooltip>
              </div>
            </form>
            
            {error && (
              <div className={`mt-4 p-4 border rounded-xl flex items-start gap-3 ${
                darkMode 
                  ? 'bg-red-900/50 border-red-700 text-red-300' 
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <span className={`mt-0.5 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>⚠️</span>
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Gewichtungspresets */}
          <div className={`rounded-2xl shadow-xl border p-6 lg:p-8 backdrop-blur-sm transition-colors duration-300 ${
            darkMode 
              ? 'bg-slate-800/80 border-slate-600/30' 
              : 'bg-white/80 border-white/20'
          }`}>
            <div className="mb-4">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                <span className="text-xl">⚖️</span>
                Gewichtungspresets
              </h3>
              <p className={`text-sm mt-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Wähle ein Preset basierend auf deinen Prioritäten
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {Object.entries(weightingPresets).map(([key, preset]) => (
                <Tooltip key={key} content={`${preset.name}: ${preset.description}. Klicken um diese Gewichtungsvorlage zu aktivieren.`}>
                  <button
                    onClick={() => applyPreset(key)}
                    className={`p-4 rounded-xl border transition-all duration-200 text-left hover:scale-105 ${
                      selectedPreset === key
                        ? darkMode 
                          ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300' 
                          : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : darkMode 
                          ? 'bg-slate-700/50 border-slate-600 text-gray-200 hover:border-emerald-500 hover:bg-slate-700/80' 
                          : 'bg-white/80 border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{preset.icon}</span>
                      <span className="font-medium text-sm">{preset.name}</span>
                    </div>
                    <p className={`text-xs ${
                      selectedPreset === key
                        ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
                        : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {preset.description}
                    </p>
                  </button>
                </Tooltip>
              ))}
              
              {/* Benutzerdefinierte Gewichtungen Anzeige */}
              {selectedPreset === 'custom' && (
                <div className={`p-4 rounded-xl border ${
                  darkMode 
                    ? 'bg-amber-900/50 border-amber-500 text-amber-300' 
                    : 'bg-amber-50 border-amber-300 text-amber-700'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎛️</span>
                    <span className="font-medium text-sm">Benutzerdefiniert</span>
                  </div>
                  <p className={`text-xs ${
                    darkMode ? 'text-amber-400' : 'text-amber-600'
                  }`}>
                    Individuelle Gewichtungen
                  </p>
                </div>
              )}
            </div>
            
            {/* Reset Button */}
            {selectedPreset !== 'default' && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={resetToDefault}
                  className={`px-4 py-2 rounded-lg border transition-all duration-200 text-sm font-medium ${
                    darkMode 
                      ? 'bg-slate-700/50 border-slate-600 text-gray-200 hover:bg-slate-600/80' 
                      : 'bg-white/80 border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ↩️ Zurück zu Standard
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className={`rounded-2xl shadow-xl border p-6 lg:p-8 backdrop-blur-sm transition-colors duration-300 ${
            darkMode 
              ? 'bg-slate-800/80 border-slate-600/30' 
              : 'bg-white/80 border-white/20'
          }`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Radius Selection */}
              <div className="space-y-4">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${
                  darkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  <span className="text-xl">📏</span>
                  Suchradius
                </h3>
                <div className="space-y-3">
                  <label className={`flex items-center p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    darkMode 
                      ? 'border-slate-600 hover:border-emerald-500 hover:bg-slate-700/50' 
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}>
                    <input
                      type="radio"
                      name="radius"
                      value="walking"
                      checked={radiusSettings.activeRadius === 'walking'}
                      onChange={(e) => setRadiusSettings({...radiusSettings, activeRadius: e.target.value as 'walking'})}
                      className="mr-3 text-emerald-500 focus:ring-emerald-400"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚶</span>
                      <span className={`font-medium ${
                        darkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>Zu Fuß ({radiusSettings.walking}m)</span>
                    </div>
                  </label>
                  <label className={`flex items-center p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    darkMode 
                      ? 'border-slate-600 hover:border-emerald-500 hover:bg-slate-700/50' 
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}>
                    <input
                      type="radio"
                      name="radius"
                      value="cycling"
                      checked={radiusSettings.activeRadius === 'cycling'}
                      onChange={(e) => setRadiusSettings({...radiusSettings, activeRadius: e.target.value as 'cycling'})}
                      className="mr-3 text-emerald-500 focus:ring-emerald-400"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚲</span>
                      <span className={`font-medium ${
                        darkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>Fahrrad ({radiusSettings.cycling/1000}km)</span>
                    </div>
                  </label>
                  <label className={`flex items-center p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    darkMode 
                      ? 'border-slate-600 hover:border-emerald-500 hover:bg-slate-700/50' 
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}>
                    <input
                      type="radio"
                      name="radius"
                      value="driving"
                      checked={radiusSettings.activeRadius === 'driving'}
                      onChange={(e) => setRadiusSettings({...radiusSettings, activeRadius: e.target.value as 'driving'})}
                      className="mr-3 text-emerald-500 focus:ring-emerald-400"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚗</span>
                      <span className={`font-medium ${
                        darkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>Auto ({radiusSettings.driving/1000}km)</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* View Options */}
              <div className="space-y-4">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${
                  darkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  <span className="text-xl">👁️</span>
                  Ansichtsoptionen
                </h3>
                <div className="space-y-3">
                  <label className={`flex items-center p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    darkMode 
                      ? 'border-slate-600 bg-slate-700/30' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={showEnviromentData}
                      onChange={(e) => setShowEnviromentData(e.target.checked)}
                      className="mr-3 text-emerald-500 focus:ring-emerald-400 rounded"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌎</span>
                      <span className={`font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Umweltdaten anzeigen</span>
                    </div>
                  </label>
                  <button
                    onClick={() => setShowSettings(true)}
                    className={`w-full p-3 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2 hover:shadow-md ${
                      darkMode 
                        ? 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-gray-200' 
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="text-lg">⚙️</span>
                    <span>Erweiterte Einstellungen</span>
                  </button>
                </div>
                <div className={`mt-4 p-3 rounded-xl border ${
                  darkMode 
                    ? 'bg-blue-900/50 border-blue-700 text-blue-300' 
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  <p className="text-xs">
                    <strong>💡 Tipp:</strong> Umweltdaten zeigen Klimadaten und Lebenszufriedenheit basierend auf offiziellen Statistiken
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Score Display und Map - Neues Layout */}
          {qualityScore && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Linke Seite: Bewertungen und Einstellungen */}
              <div className="space-y-6">
                {/* Gesamtbewertung */}
                <div className={`rounded-2xl shadow-xl border p-6 backdrop-blur-sm transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-slate-800/80 border-slate-600/30' 
                    : 'bg-white/80 border-white/20'
                }`}>
                  <div className="mb-6">
                    <h2 className={`text-2xl lg:text-3xl font-bold mb-2 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      📊 Lebensqualitäts-Analyse
                    </h2>
                    <p className={`text-sm lg:text-base ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      für <span className="font-semibold text-emerald-500">{qualityScore.address}</span>
                    </p>
                  </div>
                  
                  {/* Große Gesamtbewertung mit Farbverlauf */}
                  <div className="text-center mb-6">
                    <Tooltip content="Die Gesamtbewertung von 0-10 basiert auf allen aktivierten Kategorien und deren Gewichtungen. Klicken Sie auf das Info-Symbol für Details zum Bewertungssystem.">
                      <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${getScoreColor(qualityScore.overall)} shadow-2xl mb-4 cursor-help`}>
                        <div className={`text-4xl font-bold ${getScoreTextColor(qualityScore.overall)}`}>
                          {recalculatingScore ? (
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white"></div>
                          ) : (
                            qualityScore.overall
                          )}
                        </div>
                      </div>
                    </Tooltip>
                    <div className={`text-lg font-medium mb-2 ${
                      darkMode ? 'text-gray-200' : 'text-gray-600'
                    }`}>
                      Gesamtbewertung
                    </div>
           
                    {recalculatingScore && (
                      <div className="text-xs text-emerald-500 mt-2 font-medium">
                        wird neu berechnet...
                      </div>
                    )}
                    
                    {/* Bundesland und Lebenszufriedenheit */}
                    {showEnviromentData && qualityScore.bundesland && (
                      <div className={`mt-4 p-3 rounded-lg ${
                        darkMode ? 'bg-slate-700/50' : 'bg-blue-50'
                      } border ${
                        darkMode ? 'border-slate-600' : 'border-blue-200'
                      }`}>
                        <div className={`text-sm font-medium ${
                          darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          📍 {qualityScore.bundesland}
                        </div>
                        {qualityScore.lebenszufriedenheit && (
                          <div className={`text-xs mt-1 ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            Lebenszufriedenheit: <span className="font-semibold text-blue-500">
                              {qualityScore.lebenszufriedenheit.toFixed(1)}/10
                            </span>
                            <span className={`ml-1 text-xs ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              (SKL Glücksatlas)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Share & Copy Buttons */}
                    <div className="mt-6 flex flex-row gap-2 justify-center">
                      <Tooltip content="Kopiere die URL dieser Analyse in die Zwischenablage zum einfachen Teilen" darkMode={darkMode}>
                        <button
                          onClick={handleCopyURL}
                          className={`px-4 py-3 rounded-xl transition-all duration-200 font-medium flex items-center gap-3 hover:shadow-lg transform hover:scale-105 ${
                            darkMode 
                              ? 'bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white border border-slate-500' 
                              : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border border-gray-300'
                          }`}
                        >
                          <span className="text-xl">🔗</span>
                          <span>URL kopieren</span>
                        </button>
                      </Tooltip>
                      
                      {isMobile ? <Tooltip content={isMobile ? "Teile deine Lebensqualitäts-Analyse mit anderen Apps" : "Teile deine Lebensqualitäts-Analyse als Bild mit Freunden und Familie"} darkMode={darkMode}>
                        <button
                          onClick={handleShare}
                          className={`px-4 py-3 rounded-xl transition-all duration-200 font-medium flex items-center gap-3 hover:shadow-lg transform hover:scale-105 ${
                            darkMode 
                              ? 'bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white' 
                              : 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white'
                          }`}
                        >
                          <span className="text-xl">{isMobile ? '📱' : '🖼️'}</span>
                          <span>{isMobile ? 'Teilen' : 'Als Bild teilen'}</span>
                        </button>
                      </Tooltip> : null}
                      
                      {/* Download Button nur auf mobilen Geräten */}
                      
                    </div>
                  </div>
                </div>

                {/* Gruppierte Kategorien */}
                <div className="space-y-4">
                  {Object.entries(categoryGroups)
                    .sort((a, b) => a[1].order - b[1].order)
                    .map(([groupKey, group]) => (
                    <div key={groupKey} className={`rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-200 ${
                      darkMode 
                        ? 'bg-slate-800 border-slate-600' 
                        : 'bg-white border-gray-200'
                    }`}>
                      {/* Gruppen-Header mit Kontrollen */}
                      <div className={`flex items-center justify-between p-4 border-b ${
                        darkMode 
                          ? 'bg-gradient-to-r from-slate-700 to-slate-600 border-slate-600' 
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={group.enabled}
                            onChange={() => toggleGroupVisibility(groupKey)}
                            className="w-5 h-5 text-emerald-500 focus:ring-emerald-400 rounded"
                          />
                          <Tooltip content={`${group.title}-Gruppe: ${group.enabled ? 'Aktiviert' : 'Deaktiviert'} mit Gewichtung ${group.weight}. Klicken Sie auf das Häkchen, um die Gruppe zu aktivieren/deaktivieren.`}>
                            <div 
                              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => toggleGroupVisibility(groupKey)}
                            >
                              <span className="text-2xl">{group.icon}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold text-lg ${
                                    darkMode ? 'text-gray-200' : 'text-gray-800'
                                  }`}>{group.title}</span>
                                  {qualityScore && (
                                    <Tooltip content={`Durchschnittlicher Score für die ${group.title}-Kategorie: ${getGroupScore(groupKey)}/10`}>
                                      <div className={`px-2 py-1 rounded-full bg-gradient-to-r ${getScoreColor(getGroupScore(groupKey))} ${getScoreTextColor(getGroupScore(groupKey))} font-bold text-xs cursor-help`}>
                                        {getGroupScore(groupKey)}/10
                                      </div>
                                    </Tooltip>
                                  )}
                                </div>
                                <div className={`text-sm ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {getWeightLabel(group.weight)}
                                </div>
                              </div>
                            </div>
                          </Tooltip>
                        </div>
                        <button
                          onClick={() => toggleGroup(groupKey)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            darkMode 
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-slate-600' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-white'
                          }`}
                        >
                          <span className="text-lg">
                            {expandedGroups[groupKey] ? '▲' : '▼'}
                          </span>
                        </button>
                      </div>
                      
                      {/* Kategorien */}
                      {expandedGroups[groupKey] && (
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className={`font-medium ${
                              darkMode ? 'text-gray-200' : 'text-gray-700'
                            }`}>Kategorien</h4>
                            <button
                              onClick={() => toggleEditMode(groupKey)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                                editingGroups[groupKey] 
                                  ? darkMode 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                  : darkMode 
                                    ? 'bg-slate-600 hover:bg-slate-500 text-gray-200' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                              }`}
                            >
                              {editingGroups[groupKey] ? '✓ Fertig' : '✏️ Bearbeiten'}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {group.categories.map(category => {
                              const score = qualityScore?.[category.key as keyof QualityScore] as number
                              const amenityKey = category.key === 'kindergarten' ? 'kindergartens' : 
                                               category.key === 'schools' ? 'schools' :
                                               category.key === 'education' ? 'education' :
                                               category.key === 'doctors' ? 'doctors' :
                                               category.key === 'pharmacies' ? 'pharmacies' :
                                               category.key === 'culture' ? 'culture' :
                                               category.key === 'sports' ? 'sports' :
                                               category.key === 'parks' ? 'parks' :
                                               category.key === 'transport' ? 'transport' :
                                               category.key === 'cycling' ? 'cycling' :
                                               category.key === 'restaurants' ? 'restaurants' :
                                               category.key === 'supermarkets' ? 'supermarkets' :
                                               category.key === 'shopping' ? 'shopping' :
                                               category.key === 'finance' ? 'finance' :
                                               category.key === 'safety' ? 'safety' :
                                               category.key === 'services' ? 'services' :
                                               category.key === 'hairdresser' ? 'hairdresser' : null
                              
                              const amenityCount = amenityKey ? (qualityScore?.amenities?.[amenityKey as keyof typeof qualityScore.amenities]?.length || 0) : 0
                              
                              return (
                                <div key={category.key} className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                                  darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'
                                }`}>
                                  <div className="flex items-center gap-3 flex-1">
                                    <input
                                      type="checkbox"
                                      checked={category.enabled && group.enabled}
                                      disabled={!group.enabled}
                                      onChange={() => toggleCategoryVisibility(groupKey, category.key)}
                                      className="w-4 h-4 text-emerald-500 focus:ring-emerald-400 rounded"
                                    />
                                    <Tooltip content={`${category.label}: ${getCategoryExamples(category.key)}. ${category.enabled && group.enabled ? 'Aktiviert' : 'Deaktiviert'} mit Gewichtung ${category.weight}.`}>
                                      <div 
                                        className={`flex items-center gap-3 flex-1 ${!group.enabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                        onClick={() => group.enabled && toggleCategoryVisibility(groupKey, category.key)}
                                      >
                                        <div className={`w-4 h-4 rounded-full ${getCategoryColor(category.key)}`}></div>
                                        <span className={`text-sm font-medium flex-1 ${
                                          darkMode ? 'text-gray-200' : 'text-gray-700'
                                        }`}>{category.label}</span>
                                      </div>
                                    </Tooltip>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {/* Farbiger Score-Badge */}
                                    <Tooltip content={`${category.label}: ${getCategoryExamples(category.key)}. Score: ${score}/10 basierend auf ${amenityCount} gefundenen Einrichtungen.`}>
                                      <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getScoreColor(score)} ${getScoreTextColor(score)} font-bold text-sm min-w-[50px] text-center cursor-help`}>
                                        {score}/10
                                      </div>
                                    </Tooltip>
                                    <div className="text-right">
                                      <div className={`text-xs ${
                                        darkMode ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                        {amenityCount} gefunden
                                      </div>
                                    </div>
                                    {/* Gewichtungsauswahl nur im Bearbeiten-Modus */}
                                                                       {editingGroups[groupKey] && (
                                      <select
                                        value={category.weight}
                                        onChange={(e) => updateCategoryWeight(groupKey, category.key, parseFloat(e.target.value))}
                                        className={`text-xs px-2 py-1 border rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-transparent ${
                                          darkMode 
                                            ? 'bg-slate-700 border-slate-600 text-gray-200' 
                                            : 'bg-white border-gray-300'
                                        }`}
                                        title="Gewichtung"
                                      >
                                        {weightOptions.map(option => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          
                          {/* Gruppengewichtung anpassbar - nur im Bearbeiten-Modus */}
                          {editingGroups[groupKey] && (
                            <div className={`mt-4 pt-4 border-t ${
                              darkMode ? 'border-slate-600' : 'border-gray-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <label className={`text-sm font-medium ${
                                  darkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>Gruppengewichtung:</label>
                                <select
                                  value={group.weight}
                                  onChange={(e) => updateGroupWeight(groupKey, parseFloat(e.target.value))}
                                  className={`text-sm px-3 py-1 border rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-transparent ${
                                    darkMode 
                                      ? 'bg-slate-700 border-slate-600 text-gray-200' 
                                      : 'bg-white border-gray-300'
                                  }`}
                                >
                                  {weightOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Klimadaten und Umweltfaktoren */}
                  {showEnviromentData ? <div className={`rounded-xl border p-4 ${
                    darkMode 
                      ? 'bg-gradient-to-r from-blue-900/50 to-green-900/50 border-blue-700' 
                      : 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-200'
                  }`}>
                    <h3 className={`font-bold mb-3 flex items-center gap-2 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      <span className="text-xl">🌤️</span>
                      Klimadaten {qualityScore.bundesland && `(${qualityScore.bundesland})`}
                    </h3>
                    
                    {qualityScore.klimadaten ? (
                      <div className="space-y-4">
                        {/* Klima-Gesamtscore */}
                        <div className={`p-3 rounded-lg border ${
                          darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className={`font-semibold ${
                              darkMode ? 'text-gray-200' : 'text-gray-700'
                            }`}>
                              🌍 Klima-Score
                            </span>
                            <span className={`font-bold text-lg ${
                              qualityScore.klimaScore! >= 7 ? 'text-green-500' : 
                              qualityScore.klimaScore! >= 4 ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                              {qualityScore.klimaScore}/10
                            </span>
                          </div>
                        </div>
                        
                        {/* Einzelne Klimawerte */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className={`p-3 rounded-lg ${
                            darkMode ? 'bg-slate-700' : 'bg-white'
                          }`}>
                            <div className="text-center">
                              <div className="text-2xl mb-1">🌡️</div>
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              ⌀-Temperatur
                              </div>
                              <div className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {qualityScore.klimadaten.temperatur}°C
                              </div>
                              <div className={`text-xs font-medium ${
                                qualityScore.temperatur! >= 7 ? 'text-green-500' : 
                                qualityScore.temperatur! >= 4 ? 'text-yellow-500' : 'text-red-500'
                              }`}>
                                Score: {qualityScore.temperatur}/10
                              </div>
                            </div>
                          </div>
                          
                          <div className={`p-3 rounded-lg ${
                            darkMode ? 'bg-slate-700' : 'bg-white'
                          }`}>
                            <div className="text-center">
                              <div className="text-2xl mb-1">🌧️</div>
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              ⌀-Niederschlag
                              </div>
                              <div className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {qualityScore.klimadaten.niederschlag}mm
                              </div>
                              <div className={`text-xs font-medium ${
                                qualityScore.niederschlag! >= 7 ? 'text-green-500' : 
                                qualityScore.niederschlag! >= 4 ? 'text-yellow-500' : 'text-red-500'
                              }`}>
                                Score: {qualityScore.niederschlag}/10
                              </div>
                            </div>
                          </div>
                          
                          <div className={`p-3 rounded-lg ${
                            darkMode ? 'bg-slate-700' : 'bg-white'
                          }`}>
                            <div className="text-center">
                              <div className="text-2xl mb-1">☀️</div>
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              ⌀-Sonnenschein
                              </div>
                              <div className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {qualityScore.klimadaten.sonnenschein}h
                              </div>
                              <div className={`text-xs font-medium ${
                                qualityScore.sonnenschein! >= 7 ? 'text-green-500' : 
                                qualityScore.sonnenschein! >= 4 ? 'text-yellow-500' : 'text-red-500'
                              }`}>
                                Score: {qualityScore.sonnenschein}/10
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className={`text-xs text-center ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Quelle: Klimastatusbericht 2024
                        </div>
                      </div>
                    ) : (
                      <div className={`text-center py-4 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <div className="text-2xl mb-2">📊</div>
                        <div>Keine Klimadaten verfügbar</div>
                        <div className="text-xs mt-1">
                          (Nur für deutsche Bundesländer verfügbar)
                        </div>
                      </div>
                    )}
                  </div> : null}
                </div>
              </div>

              {/* Rechte Seite: Karte */}
              <div className={`rounded-2xl h-max shadow-xl border backdrop-blur-sm transition-colors duration-300 ${
                darkMode 
                  ? 'bg-slate-800/80 border-slate-600/30' 
                  : 'bg-white/80 border-white/20'
              }`}>
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className={`text-2xl lg:text-3xl font-bold mb-2 flex items-center gap-3 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      <span className="text-2xl">🗺️</span>
                      Interaktive Karte
                    </h2>
                    <p className={`text-sm lg:text-base ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Klicke auf die Karte, um einen neuen Standort zu analysieren
                    </p>
                  </div>
                  
                  <div className="h-96 lg:h-[600px] w-full relative rounded-xl overflow-hidden shadow-lg">
                    {mapLoading && (
                      <div className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center z-10 ${
                        darkMode ? 'bg-slate-800/90' : 'bg-white/90'
                      }`}>
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-emerald-500"></div>
                          <span className={`font-medium ${
                            darkMode ? 'text-gray-200' : 'text-gray-700'
                          }`}>Daten werden geladen...</span>
                        </div>
                      </div>
                    )}
                    <Map 
                      qualityScore={qualityScore} 
                      onLocationClick={handleLocationClick}
                      showHeatmap={showHeatmap}
                      radiusSettings={radiusSettings}
                      categoryVisibility={categoryVisibility}
                    />
                  </div>
                  
                  {/* Info-Box für Benutzer */}
                  <div className={`mt-6 p-4 rounded-xl border ${
                    darkMode 
                      ? 'bg-gradient-to-r from-blue-900/50 to-emerald-900/50 border-blue-700 text-blue-300' 
                      : 'bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200 text-blue-700'
                  }`}>
                    <h4 className={`font-bold mb-3 flex items-center gap-2 ${
                      darkMode ? 'text-blue-200' : 'text-blue-800'
                    }`}>
                      <span className="text-lg">ℹ️</span>
                      Karteninformation
                    </h4>
                    <div className="text-sm space-y-2">
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>•</span>
                        <span><strong>Basiskarte:</strong> Zeigt alle OpenStreetMap-Daten (Gebäude, Straßen, etc.)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>•</span>
                        <span><strong>Farbige Marker:</strong> Zeigen nur die von unserer API erfassten Einrichtungen im gewählten Radius ({radiusSettings.activeRadius === 'walking' ? `${radiusSettings.walking}m` : radiusSettings.activeRadius === 'cycling' ? `${radiusSettings.cycling/1000}km` : `${radiusSettings.driving/1000}km`})</span>
                      </div>
                      {getTotalVisibleMarkers() > 80 && (
                        <div className="flex items-start gap-2">
                          <span className={`mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>•</span>
                          <span><strong>Performance-Modus:</strong> {getTotalVisibleMarkers()} Marker gefunden - wird seitenweise angezeigt (max. 80 pro Seite) für bessere Performance</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>•</span>
                        <span><strong>Fehlende Marker?</strong> Möglicherweise unvollständige OpenStreetMap-Daten oder außerhalb des Suchradius</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wenn keine Bewertung vorhanden, zeige nur die Karte */}
          {!qualityScore && (
            <div className={`rounded-2xl shadow-xl border p-6 lg:p-8 backdrop-blur-sm transition-colors duration-300 ${
              darkMode 
                ? 'bg-slate-800/80 border-slate-600/30' 
                : 'bg-white/80 border-white/20'
            }`}>
              <div className="mb-6">
                <h2 className={`text-2xl lg:text-3xl font-bold mb-2 flex items-center gap-3 ${
                  darkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  <span className="text-2xl">🗺️</span>
                  Interaktive Karte
                </h2>
                <p className={`text-sm lg:text-base ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Klicke auf die Karte, um einen neuen Standort zu analysieren
                </p>
              </div>
              
              <div className="h-96 lg:h-[500px] w-full relative rounded-xl overflow-hidden shadow-lg">
                {mapLoading && (
                  <div className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center z-10 ${
                    darkMode ? 'bg-slate-800/90' : 'bg-white/90'
                  }`}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-emerald-500"></div>
                      <span className={`font-medium ${
                        darkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>Daten werden geladen...</span>
                    </div>
                  </div>
                )}
                <Map 
                  qualityScore={qualityScore} 
                  onLocationClick={handleLocationClick}
                  showHeatmap={showHeatmap}
                  radiusSettings={radiusSettings}
                  categoryVisibility={categoryVisibility}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        radiusSettings={radiusSettings}
        onSave={handleSettingsSave}
      />

      <InfoModal
        isOpen={showInfo}
        darkMode={darkMode}
        onClose={() => setShowInfo(false)}
      />
    </div>
  )
}