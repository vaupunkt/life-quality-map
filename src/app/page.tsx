'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import SettingsModal from '@/components/SettingsModal'

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
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [mapLoading, setMapLoading] = useState(false)
  const [recalculatingScore, setRecalculatingScore] = useState(false)
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null)
  const [error, setError] = useState('')
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
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
    nahverkehr: {
      title: 'Nahverkehr',
      icon: '🚌',
      weight: 1.0,
      order: 4,
      categories: [
        { key: 'transport', label: 'ÖPNV', weight: 1.2, enabled: true }
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
    nahverkehr: false,
    alltag: false
  })

  // State für Bearbeiten-Modus der Gruppen
  const [editingGroups, setEditingGroups] = useState<{[key: string]: boolean}>({
    bildung: false,
    gesundheit: false,
    freizeit: false,
    nahverkehr: false,
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
  }, [radiusSettings.activeRadius, radiusSettings.walking, radiusSettings.cycling, radiusSettings.driving])

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
  }, [categoryGroups]) // Nur categoryGroups als Dependency, da categoryVisibility davon abgeleitet wird

  const handleSettingsSave = (newSettings: any) => {
    setRadiusSettings(newSettings)
  }

  const handleLocationClick = async (lat: number, lng: number) => {
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
  }

  const calculateQualityScore = async (lat: number, lng: number, addressName: string) => {
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
    } finally {
      setMapLoading(false)
      setRecalculatingScore(false)
    }
  }

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
      supermarkets: 'bg-yellow-500',
      restaurants: 'bg-yellow-600',
      shopping: 'bg-teal-600',
      finance: 'bg-green-700',
      safety: 'bg-red-700',
      services: 'bg-gray-600'
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
  const recalculateScoreLocally = (currentScore: QualityScore): QualityScore => {
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
  }

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
        nahverkehr: { weight: 1.0, categories: { transport: 1.2 } },
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
        nahverkehr: { weight: 1.0, categories: { transport: 1.1 } },
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
        nahverkehr: { weight: 1.2, categories: { transport: 1.2 } },
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
        nahverkehr: { weight: 1.2, categories: { transport: 1.2 } },
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
        nahverkehr: { weight: 1.2, categories: { transport: 1.2 } },
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
  }, [categoryGroups])

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
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                darkMode 
                  ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400' 
                  : 'bg-white/80 hover:bg-white text-gray-600 hover:text-yellow-500'
              } shadow-lg`}
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              <span className="text-xl">{darkMode ? '☀️' : '🌙'}</span>
            </button>
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
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                📍 Adresse oder Ort eingeben
              </label>
            </div>
            <form onSubmit={handleAddressSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="z.B. Alexanderplatz, Berlin oder klicke auf die Karte"
                className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                  darkMode 
                    ? 'bg-slate-700/80 border-slate-600 text-white placeholder-gray-400' 
                    : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCurrentLocation}
                  disabled={loading}
                  className={`px-4 py-3 rounded-xl border transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                    darkMode 
                      ? 'bg-slate-700/80 border-slate-600 text-gray-200 hover:bg-slate-600/80' 
                      : 'bg-white/80 border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Meinen aktuellen Standort verwenden"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                  ) : (
                    <span className="text-lg">📍</span>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none whitespace-nowrap"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Laden...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>🔍</span>
                      <span>Bewerten</span>
                    </div>
                  )}
                </button>
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
                <button
                  key={key}
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
                      ? 'border-slate-600 hover:border-emerald-500 hover:bg-slate-700/50' 
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={showHeatmap}
                      onChange={(e) => setShowHeatmap(e.target.checked)}
                      className="mr-3 text-emerald-500 focus:ring-emerald-400 rounded"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌡️</span>
                      <span className={`font-medium ${
                        darkMode ? 'text-gray-200' : 'text-gray-700'
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
                    <strong>💡 Tipp:</strong> Umweltdaten zeigen simulierte Werte für Lärm und Verkehrsbelastung
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
                    <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${getScoreColor(qualityScore.overall)} shadow-2xl mb-4`}>
                      <div className={`text-4xl font-bold ${getScoreTextColor(qualityScore.overall)}`}>
                        {recalculatingScore ? (
                          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white"></div>
                        ) : (
                          qualityScore.overall
                        )}
                      </div>
                    </div>
                    <div className={`text-lg font-medium mb-2 ${
                      darkMode ? 'text-gray-200' : 'text-gray-600'
                    }`}>
                      Gesamtbewertung
                    </div>
                    <div className="flex justify-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${
                              star <= qualityScore.overall / 2 ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                    {recalculatingScore && (
                      <div className="text-xs text-emerald-500 mt-2 font-medium">
                        wird neu berechnet...
                      </div>
                    )}
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
                                  <div className={`px-2 py-1 rounded-full bg-gradient-to-r ${getScoreColor(getGroupScore(groupKey))} ${getScoreTextColor(getGroupScore(groupKey))} font-bold text-xs`}>
                                    {getGroupScore(groupKey)}/10
                                  </div>
                                )}
                              </div>
                              <div className={`text-sm ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {getWeightLabel(group.weight)}
                              </div>
                            </div>
                          </div>
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
                                               category.key === 'restaurants' ? 'restaurants' :
                                               category.key === 'supermarkets' ? 'supermarkets' :
                                               category.key === 'shopping' ? 'shopping' :
                                               category.key === 'finance' ? 'finance' :
                                               category.key === 'safety' ? 'safety' :
                                               category.key === 'services' ? 'services' : null
                              
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
                                    <div 
                                      className={`flex items-center gap-3 flex-1 ${!group.enabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                      onClick={() => group.enabled && toggleCategoryVisibility(groupKey, category.key)}
                                    >
                                      <div className={`w-4 h-4 rounded-full ${getCategoryColor(category.key)}`}></div>
                                      <span className={`text-sm font-medium flex-1 ${
                                        darkMode ? 'text-gray-200' : 'text-gray-700'
                                      }`}>{category.label}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {/* Farbiger Score-Badge */}
                                    <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getScoreColor(score)} ${getScoreTextColor(score)} font-bold text-sm min-w-[50px] text-center`}>
                                      {score}/10
                                    </div>
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
                  
                  {/* Lärmbelastung und Verkehr */}
                  <div className={`rounded-xl border p-4 ${
                    darkMode 
                      ? 'bg-gradient-to-r from-red-900/50 to-orange-900/50 border-red-700' 
                      : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
                  }`}>
                    <h3 className={`font-bold mb-3 flex items-center gap-2 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      <span className="text-xl">⚠️</span>
                      Belastungsfaktoren
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className={`flex justify-between items-center p-3 rounded-lg ${
                        darkMode ? 'bg-slate-700' : 'bg-white'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔊</span>
                          <span className={`font-medium ${
                            darkMode ? 'text-gray-200' : 'text-gray-700'
                          }`}>Lärm</span>
                        </div>
                        <span className="font-bold text-red-500 text-lg">{qualityScore.noise}/10</span>
                      </div>
                      <div className={`flex justify-between items-center p-3 rounded-lg ${
                        darkMode ? 'bg-slate-700' : 'bg-white'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🚦</span>
                          <span className={`font-medium ${
                            darkMode ? 'text-gray-200' : 'text-gray-700'
                          }`}>Verkehr</span>
                        </div>
                        <span className="font-bold text-red-500 text-lg">{qualityScore.traffic}/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rechte Seite: Karte */}
              <div className={`rounded-2xl shadow-xl border backdrop-blur-sm transition-colors duration-300 ${
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
    </div>
  )
}
