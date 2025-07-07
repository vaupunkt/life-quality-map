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

export default function Home() {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [mapLoading, setMapLoading] = useState(false)
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null)
  const [error, setError] = useState('')
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [radiusSettings, setRadiusSettings] = useState({
    walking: 800,     // 800m walking distance
    cycling: 2000,    // 2km cycling distance  
    driving: 5000,    // 5km driving distance
    activeRadius: 'walking' as 'walking' | 'cycling' | 'driving'
  })

  // Kategorien-Gruppen mit Gewichtung und Reihenfolge
  const [categoryGroups, setCategoryGroups] = useState({
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
        { key: 'restaurants', label: 'Restaurants', weight: 0.7, enabled: true }
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
        { key: 'transport', label: 'ÖPNV', weight: 1.3, enabled: true }
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
        { key: 'finance', label: 'Banken', weight: 0.6, enabled: true },
        { key: 'safety', label: 'Sicherheit', weight: 1.1, enabled: true },
        { key: 'services', label: 'Services', weight: 0.7, enabled: true }
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

  // Berechne categoryVisibility basierend auf categoryGroups
  const categoryVisibility = Object.values(categoryGroups).reduce((acc, group) => {
    if (group.enabled) {
      group.categories.forEach(cat => {
        acc[cat.key] = cat.enabled
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
          radius: currentRadius
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

  // Helper-Funktionen
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  const toggleGroupVisibility = (groupKey: string) => {
    setCategoryGroups(prev => ({
      ...prev,
      [groupKey]: {
        ...prev[groupKey as keyof typeof prev],
        enabled: !prev[groupKey as keyof typeof prev].enabled
      }
    }))
  }

  const toggleCategoryVisibility = (groupKey: string, categoryKey: string) => {
    setCategoryGroups(prev => ({
      ...prev,
      [groupKey]: {
        ...prev[groupKey as keyof typeof prev],
        categories: prev[groupKey as keyof typeof prev].categories.map(cat => 
          cat.key === categoryKey ? { ...cat, enabled: !cat.enabled } : cat
        )
      }
    }))
  }

  const moveGroupUp = (groupKey: string) => {
    setCategoryGroups(prev => {
      const groups = Object.entries(prev)
      const currentIndex = groups.findIndex(([key]) => key === groupKey)
      if (currentIndex > 0) {
        const newGroups = [...groups]
        const [current] = newGroups.splice(currentIndex, 1)
        newGroups.splice(currentIndex - 1, 0, current)
        
        const reordered = newGroups.reduce((acc, [key, group], index) => {
          acc[key] = { ...group, order: index + 1 }
          return acc
        }, {} as typeof prev)
        
        return reordered
      }
      return prev
    })
  }

  const moveGroupDown = (groupKey: string) => {
    setCategoryGroups(prev => {
      const groups = Object.entries(prev)
      const currentIndex = groups.findIndex(([key]) => key === groupKey)
      if (currentIndex < groups.length - 1) {
        const newGroups = [...groups]
        const [current] = newGroups.splice(currentIndex, 1)
        newGroups.splice(currentIndex + 1, 0, current)
        
        const reordered = newGroups.reduce((acc, [key, group], index) => {
          acc[key] = { ...group, order: index + 1 }
          return acc
        }, {} as typeof prev)
        
        return reordered
      }
      return prev
    })
  }

  const updateCategoryWeight = (groupKey: string, categoryKey: string, weight: number) => {
    setCategoryGroups(prev => ({
      ...prev,
      [groupKey]: {
        ...prev[groupKey as keyof typeof prev],
        categories: prev[groupKey as keyof typeof prev].categories.map(cat => 
          cat.key === categoryKey ? { ...cat, weight } : cat
        )
      }
    }))
  }

  const updateGroupWeight = (groupKey: string, weight: number) => {
    setCategoryGroups(prev => ({
      ...prev,
      [groupKey]: {
        ...prev[groupKey as keyof typeof prev],
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Lebensqualitäts-Karte
        </h1>
        
        <div className="max-w-4xl mx-auto">
          {/* Address Input */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <form onSubmit={handleAddressSubmit} className="flex gap-4">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse eingeben (z.B. Alexanderplatz, Berlin) oder auf die Karte klicken"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Laden...' : 'Bewerten'}
              </button>
            </form>
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Radius Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Entfernung</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="radius"
                      value="walking"
                      checked={radiusSettings.activeRadius === 'walking'}
                      onChange={(e) => setRadiusSettings({...radiusSettings, activeRadius: e.target.value as 'walking'})}
                      className="mr-2"
                    />
                    <span className="text-gray-700">Laufbare Entfernung ({radiusSettings.walking}m)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="radius"
                      value="cycling"
                      checked={radiusSettings.activeRadius === 'cycling'}
                      onChange={(e) => setRadiusSettings({...radiusSettings, activeRadius: e.target.value as 'cycling'})}
                      className="mr-2"
                    />
                    <span className="text-gray-700">Fahrrad-Entfernung ({radiusSettings.cycling/1000}km)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="radius"
                      value="driving"
                      checked={radiusSettings.activeRadius === 'driving'}
                      onChange={(e) => setRadiusSettings({...radiusSettings, activeRadius: e.target.value as 'driving'})}
                      className="mr-2"
                    />
                    <span className="text-gray-700">Auto-Entfernung ({radiusSettings.driving/1000}km)</span>
                  </label>
                </div>
              </div>

              {/* Heatmap Toggle */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Ansicht</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showHeatmap}
                      onChange={(e) => setShowHeatmap(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-gray-700">Luftqualität/Verkehr anzeigen</span>
                  </label>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="w-full mt-3 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Einstellungen
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Zeigt simulierte Daten für Luftverschmutzung und Verkehrsbelastung
                </p>
              </div>
            </div>
          </div>

          {/* Quality Score Display - Gruppiert mit direkter Kontrolle */}
          {qualityScore && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Lebensqualitäts-Score für {qualityScore.address}
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gesamtbewertung */}
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600 mb-2">
                    {qualityScore.overall}
                  </div>
                  <div className="text-lg text-gray-600">Gesamtbewertung</div>
                </div>
                
                {/* Gruppierte Kategorien mit Kontrollen */}
                <div className="lg:col-span-2 space-y-4">
                  {Object.entries(categoryGroups)
                    .sort((a, b) => a[1].order - b[1].order)
                    .map(([groupKey, group]) => (
                    <div key={groupKey} className="border border-gray-200 rounded-lg">
                      {/* Gruppen-Header mit Kontrollen */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-t-lg">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={group.enabled}
                            onChange={() => toggleGroupVisibility(groupKey)}
                            className="w-4 h-4"
                          />
                          <span className="text-lg">{group.icon}</span>
                          <span className="font-medium text-gray-800">{group.title}</span>
                          <span className="text-sm text-gray-500">
                            (Gewichtung: {group.weight.toFixed(1)})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveGroupUp(groupKey)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Nach oben"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveGroupDown(groupKey)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Nach unten"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => toggleGroup(groupKey)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            {expandedGroups[groupKey] ? '▲' : '▼'}
                          </button>
                        </div>
                      </div>
                      
                      {/* Kategorien */}
                      <div className="p-3 bg-white rounded-b-lg border-t border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {group.categories.map(category => {
                            const score = qualityScore?.[category.key as keyof QualityScore] as number
                            const amenityCount = qualityScore?.amenities?.[category.key as keyof typeof qualityScore.amenities]?.length || 0
                            
                            return (
                              <div key={category.key} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={category.enabled}
                                    onChange={() => toggleCategoryVisibility(groupKey, category.key)}
                                    className="w-3 h-3"
                                  />
                                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(category.key)}`}></div>
                                  <span className="text-sm text-gray-700">{category.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    {score}/10 ({amenityCount})
                                  </span>
                                  {expandedGroups[groupKey] && (
                                    <input
                                      type="number"
                                      value={category.weight}
                                      onChange={(e) => updateCategoryWeight(groupKey, category.key, parseFloat(e.target.value))}
                                      className="w-12 text-xs px-1 border rounded"
                                      min="0"
                                      max="2"
                                      step="0.1"
                                      title="Gewichtung"
                                    />
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        
                        {/* Gruppengewichtung anpassbar */}
                        {expandedGroups[groupKey] && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-600">Gruppengewichtung:</label>
                              <input
                                type="number"
                                value={group.weight}
                                onChange={(e) => updateGroupWeight(groupKey, parseFloat(e.target.value))}
                                className="w-16 text-xs px-2 py-1 border rounded"
                                min="0"
                                max="2"
                                step="0.1"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Lärmbelastung und Verkehr */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-red-50">
                    <h3 className="font-medium text-gray-800 mb-2">Belastungen</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Lärmbelastung</span>
                        <span className="font-semibold text-red-600">{qualityScore.noise}/10</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Verkehrsbelastung</span>
                        <span className="font-semibold text-red-600">{qualityScore.traffic}/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Interaktive Karte</h2>
              
              {/* Gruppierte Kategorien-Auswahl */}
              <div className="space-y-2 mb-4">
                {Object.entries(categoryGroups).map(([groupKey, group]) => (
                  <div key={groupKey} className="border border-gray-200 rounded-lg">
                    {/* Gruppen-Header */}
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-t-lg">
                      <input
                        type="checkbox"
                        checked={groupVisibility[groupKey]}
                        onChange={() => toggleGroupVisibility(groupKey)}
                        className="w-4 h-4"
                      />
                      <span className="text-lg">{group.icon}</span>
                      <span className="font-medium text-gray-800 flex-1">{group.title}</span>
                      <button
                        onClick={() => toggleGroup(groupKey)}
                        className="text-gray-500 hover:text-gray-700 p-1"
                      >
                        {expandedGroups[groupKey] ? '▲' : '▼'}
                      </button>
                    </div>
                    
                    {/* Kategorien (aufklappbar) */}
                    {expandedGroups[groupKey] && (
                      <div className="p-3 bg-white rounded-b-lg border-t border-gray-200">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {group.categories.map(categoryKey => {
                            const score = qualityScore?.[categoryKey as keyof QualityScore] as number
                            const amenityCount = qualityScore?.amenities?.[categoryKey as keyof typeof qualityScore.amenities]?.length || 0
                            
                            return (
                              <label key={categoryKey} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={categoryVisibility[categoryKey]}
                                  onChange={() => toggleCategoryVisibility(categoryKey)}
                                  className="w-3 h-3"
                                />
                                <div className={`w-3 h-3 rounded-full ${getCategoryColor(categoryKey)}`}></div>
                                <span className="text-sm text-gray-700 flex-1">
                                  {getCategoryLabel(categoryKey)}
                                </span>
                                {qualityScore && (
                                  <span className="text-xs text-gray-500">
                                    {score}/10 ({amenityCount})
                                  </span>
                                )}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="h-96 w-full relative">
              {mapLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="text-gray-600">Daten werden geladen...</span>
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
            <p className="text-sm text-gray-500 mt-2">
              Klicken Sie auf die Karte, um einen neuen Ort zu bewerten
            </p>
          </div>
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
