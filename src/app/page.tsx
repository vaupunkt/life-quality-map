'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import {  useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import SettingsModal from '@/components/SettingsModal'
import InfoModal from '@/components/InfoModal'
import updateURL from '../utils/updateURL'
import handleAddressSearch from '../utils/handleAddressSearch'
import { ActiveCategories, CategoryGroup, QualityScore, RadiusSettings, WeightOption } from '../utils/types'
import generateShareImage from '@/utils/generateShareImage'
import { categoryVisibility, getCategoryColor, getScoreColor, getScoreTextColor, getTotalVisibleMarkers, getWeightLabel, recalculateScoreLocally, toggleCategoryVisibility, toggleGroupVisibility, updateCategoryWeight, updateGroupWeight, weightingPresets, weightOptions } from './helper/helperFunctions'
import { useTopPlaces } from './helper/useTopPlaces'
import { shareOnMobile } from 'react-mobile-share'

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/MapWrapper'), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-200 animate-pulse rounded-lg"></div>
})

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
  const searchParams = useSearchParams()
  const [address, setAddress] = useState('')
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [mapLoading, setMapLoading] = useState(false)
  const [recalculatingScore, setRecalculatingScore] = useState(false)
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null)
  const [error, setError] = useState('')
  const [showEnviromentData, setShowEnviromentData] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const fullPageLoading = loading || mapLoading || recalculatingScore || (qualityScore === null && coordinates !== null);

  // Mobile Detection
  const [isMobile, setIsMobile] = useState(true)
  
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && navigator.share) {
  //     console.log(navigator.share())
  //     setIsMobile(navigator.canShare())
  //   }
  // }, [])


  const [radiusSettings, setRadiusSettings] = useState<RadiusSettings>({
    walking: 500,     // 500m walking distance
    cycling: 1500,    // 1.5km cycling distance
    driving: 3000,    // 3km driving distance
    activeRadius: 'walking'
  })

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

  const [expandedGroups, setExpandedGroups] = useState<ActiveCategories>({
    bildung: false,
    gesundheit: false,
    freizeit: false,
    infrastruktur: false,
    alltag: false
  })

  const [editingGroups, setEditingGroups] = useState<{[key: string]: boolean}>({
    bildung: false,
    gesundheit: false,
    freizeit: false,
    infrastruktur: false,
    alltag: false
  })

  // Top 10 Places
  // const [topPlacesRefreshKey, setTopPlacesRefreshKey] = useState(0)
  // const topPlaces = useTopPlaces(topPlacesRefreshKey)
  // const [showTopList, setShowTopList] = useState(false)

  // SSR-safe current URL
  const [currentUrl, setCurrentUrl] = useState('')
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href)
    }
  }, [])


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
      const timer = setTimeout(() => {
        const recalculatedScore = recalculateScoreLocally(qualityScore, categoryGroups)
        if (recalculatedScore.overall !== qualityScore.overall) {
          setQualityScore(recalculatedScore)
        }
        setRecalculatingScore(false)
      }, 150)
      
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
      const reverseResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: {
          'User-Agent': 'LebensqualitaetsKarte/1.0',
        },
      })
      
      const reverseData = await reverseResponse.json()
      const clickedAddress = reverseData.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      
      setAddress(clickedAddress)
      setCoordinates({ lat, lng })
      updateURL(clickedAddress, { lat, lng }, setCurrentUrl)
      
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
      if (addressName && coordinates) {
        updateURL(addressName, coordinates,setCurrentUrl)
        console.log('URL updated after quality score calculation:', addressName)
      }
      // Top10-Liste nach erfolgreichem Score-API-Call aktualisieren
      // setTopPlacesRefreshKey(k => k + 1)
    } finally {
      setMapLoading(false)
      setRecalculatingScore(false)
    }
  }, [radiusSettings, categoryGroups, categoryVisibility, coordinates]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddressSubmit = async (e:  React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget;
    const addressInput = form.elements.namedItem('address') as HTMLInputElement;
    const address = addressInput.value.trim();
    if (!address) return

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
      
      // Update URL after successful address input
      updateURL(address, { lat: data.lat, lng: data.lng }, setCurrentUrl)
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
          setCoordinates({ lat: latitude, lng: longitude })
          
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
        maximumAge: 300000 // 5 Minutes Cache
      }
    )
  }

  async function getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: {
          'User-Agent': 'LebensqualitaetsKarte/1.0',
        },
      })
      const data = await response.json()
      if (data.display_name) {
        setAddress(data.display_name)
      }
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    } catch (error) {
      console.error('Fehler beim Abrufen der Adresse:', error)
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  }

  useEffect(() => {
      const fetchData = async () => {
        const latParam = searchParams.get('lat')
        const lngParam = searchParams.get('lng')
        if (latParam && lngParam && !coordinates) {
          const lat = parseFloat(latParam)
          const lng = parseFloat(lngParam)
          if (!isNaN(lat) && !isNaN(lng)) {
            // Fetch address from coordinates
            const addressFromCords = await getAddressFromCoordinates(lat, lng)
            setCoordinates({ lat, lng })
            handleAddressSearch(addressFromCords, { lat, lng }, setLoading, setError, setCurrentUrl, calculateQualityScore)
          } else {
            setError('Ungültige Koordinaten in der URL')
          }
        }
      }
      fetchData()
    }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps



  const handleShare = async () => {
    if (!qualityScore) return // Fix: do not proceed if null
    
    try {
      const imageDataUrl = await generateShareImage(darkMode, qualityScore)
      if (!imageDataUrl) return
      
      // Convert Data URL zu Blob
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()
      
      const shareData = {
        title: `Lebensqualität in ${qualityScore.address}`,
        text: `🍀 Lebensqualitäts-Analyse für ${qualityScore.address}\n\n📊 Gesamtbewertung: ${qualityScore.overall}/10\n\nEntdecke die Lebensqualität in deiner Stadt!`,
        url: currentUrl,
        files: [new File([blob], `lebensqualitaet-${qualityScore.address.replace(/[^a-zA-Z0-9]/g, '-')}.png`, { type: 'image/png' })]
      }
      
      // const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile) {
        try {
            console.log('navigator.share() supported, attempting to share...')
            shareOnMobile({
              images: [imageDataUrl],
              title: shareData.title,
              text: shareData.text,
              url: shareData.url,
            })
            
         
            return
          }
         catch (shareError) {
          console.log('Web Share API fehlgeschlagen:', shareError)
        }
      }
      else if (navigator.clipboard) {
        navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url,
          files: shareData.files
        }).then(() => {
          console.log('Ergebnisse erfolgreich geteilt!')
        }).catch((error) => {
          console.error('Fehler beim Teilen:', error)
          alert('Fehler beim Teilen der Ergebnisse')
        })
        
        await navigator.clipboard.writeText(currentUrl)
      } else {
      }
    } catch (error) {
      console.error('Fehler beim Teilen:', error)
      alert('Fehler beim Teilen der Ergebnisse')
    }
  }

  const handleCopyURL = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      const originalTitle = document.title
      document.title = '✓ URL kopiert!'
      setTimeout(() => {
        document.title = originalTitle
      }, 1000)
    } catch (error) {
      console.error('Fehler beim Kopieren der URL:', error)
      const textArea = document.createElement('textarea')
      textArea.value = currentUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  // Helper function to recalculate score locally
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

  const getGroupScore = (groupKey: string): number => {
    if (!qualityScore) return 0 // Fix: return 0 if null
    
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

 
  const [selectedPreset, setSelectedPreset] = useState<string>('default')

  const applyPreset = (presetKey: string) => {
    const preset = weightingPresets[presetKey as keyof typeof weightingPresets]
    if (!preset) return

    const newCategoryGroups = { ...categoryGroups }
    
    Object.entries(preset.groups).forEach(([groupKey, groupData]) => {
      if (newCategoryGroups[groupKey]) {
        newCategoryGroups[groupKey].weight = groupData.weight
        
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

  const resetToDefault = () => {
    applyPreset('default')
  }

  const detectCurrentPreset = () => {
    for (const [key, preset] of Object.entries(weightingPresets)) {
      let matches = true
      
      for (const [groupKey, groupData] of Object.entries(preset.groups)) {
        if (!categoryGroups[groupKey] || Math.abs(categoryGroups[groupKey].weight - groupData.weight) > 0.01) {
          matches = false
          break
        }
        
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
    
    return 'custom'
  }

  useEffect(() => {
    const currentPreset = detectCurrentPreset()
    if (currentPreset !== selectedPreset) {
      setSelectedPreset(currentPreset)
    }
  }, [categoryGroups]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' 
        : 'bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50'
    }`}>
      {/* Top 10 Liste */}
      {/* <div className="container mx-auto max-w-2xl p-6">
        <button
          className={`w-full flex items-center justify-between px-6 py-4 rounded-xl border shadow-lg font-bold text-lg transition-all duration-200 ${
            darkMode ? 'bg-slate-800 border-slate-600 text-emerald-300' : 'bg-white border-emerald-200 text-emerald-700'
          }`}
          onClick={() => setShowTopList(v => !v)}
        >
          <span>🏆 Top 10 bestbewertete Orte (30 Tage)</span>
          <span>{showTopList ? '▲' : '▼'}</span>
        </button>
        {showTopList && (
          <div className={`mt-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-emerald-50 border-emerald-100'} shadow-inner`}> 
            <ol className="divide-y divide-emerald-200">
              {topPlaces.length === 0 && (
                <li className="p-4 text-center text-gray-400">Keine Daten vorhanden</li>
              )}
              {topPlaces.map((place, i) => (
                <li key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 hover:bg-emerald-100/40 transition">
                  <div>
                    <span className="font-bold mr-2">{i+1}.</span>
                    <span className="font-medium">{place.city}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400 text-white font-bold text-sm">{place.score}/10</span>
                    <a href={`/?lat=${place.lat}&lng=${place.lng}`} className="text-emerald-600 underline text-xs" title="Zur Karte">Karte</a>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div> */}

      {/* Full-page loading overlay */}
      {fullPageLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
                    <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-400 mx-auto mb-4"></div>
                        <p className="text-xl font-semibold">Lebensqualitäts-Karte wird geladen...</p>
                        <p className="text-md text-gray-300 mt-2">Bitte warten Sie, bis alle Daten geladen sind.</p>
                    </div>
                </div>
            )}

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
                <div className="relative w-full">
                  <input
                    type="text"
                    name="address"
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
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
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
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none text-lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-4 border-white"></div>
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

         { /* Weighting Presets */}
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
              
              {/* Custom Weightings Display */}
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

          {/* Quality Score Display and Map  */}
          {qualityScore && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Left Side */}
              <div className="space-y-6">
                {/* Rating */}
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
                  
                  {/* Overall Rating */}
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
                      <button
                        onClick={handleCopyURL}
                        className={`px-4 py-3 rounded-xl transition-all duration-200 font-medium flex items-center gap-3 hover:shadow-lg transform hover:scale-105 ${
                          darkMode 
                            ? 'bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white border border-slate-500' 
                            : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border border-gray-300'
                        }`}
                        title="Kopiere die URL dieser Analyse in die Zwischenablage zum einfachen Teilen"
                      >
                        <span className="text-xl">🔗</span>
                        <span>URL kopieren</span>
                      </button>
                      
                    
                       {isMobile && currentUrl.includes("https") ? <button
                          onClick={handleShare}
                          className={`px-4 py-3 rounded-xl transition-all duration-200 font-medium flex items-center gap-3 hover:shadow-lg transform hover:scale-105 ${
                            darkMode 
                              ? 'bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white' 
                              : 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white'
                          }`}
                          title="Teile deine Lebensqualitäts-Analyse mit anderen Apps"
                        >
                          <span className="text-xl">{isMobile ? '📱' : '🖼️'}</span>
                          <span>{isMobile ? 'Teilen' : 'Als Bild teilen'}</span>
                        </button> : null}
               
                                            
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
                            onChange={() => toggleGroupVisibility(groupKey,setCategoryGroups)}
                            className="w-5 h-5 text-emerald-500 focus:ring-emerald-400 rounded"
                          />
                          <div 
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => toggleGroupVisibility(groupKey,setCategoryGroups)}
                          >
                            <span className="text-2xl">{group.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-lg ${
                                  darkMode ? 'text-gray-200' : 'text-gray-800'
                                }`}>{group.title}</span>
                                {qualityScore && (
                                  <div className={`px-2 py-1 rounded-full bg-gradient-to-r ${getScoreColor(getGroupScore(groupKey))} ${getScoreTextColor(getGroupScore(groupKey))} font-bold text-xs cursor-help`}>
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
                                      onChange={() => toggleCategoryVisibility(groupKey, category.key, setCategoryGroups)}
                                      className="w-4 h-4 text-emerald-500 focus:ring-emerald-400 rounded"
                                    />
                                    <div 
                                      className={`flex items-center gap-3 flex-1 ${!group.enabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                      onClick={() => group.enabled && toggleCategoryVisibility(groupKey, category.key, setCategoryGroups)}
                                    >
                                      <div className={`w-4 h-4 rounded-full ${getCategoryColor(category.key)}`}></div>
                                      <span className={`text-sm font-medium flex-1 ${
                                        darkMode ? 'text-gray-200' : 'text-gray-700'
                                      }`}>{category.label}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {/* Farbiger Score-Badge */}
                                    <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getScoreColor(score)} ${getScoreTextColor(score)} font-bold text-sm min-w-[50px] text-center cursor-help`}>
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
                                        onChange={(e) => updateCategoryWeight(groupKey, category.key, parseFloat(e.target.value), setCategoryGroups)}
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
                                  onChange={(e) => updateGroupWeight(groupKey, parseFloat(e.target.value), setCategoryGroups)}
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
                      radiusSettings={radiusSettings}
                    />
                  </div>
                  
                  {/* Info box for users */}
                  <div className={`mt-6 p-4 rounded-xl border ${
                    darkMode 
                      ? 'bg-gradient-to-r from-blue-900/50 to-green-900/50 border-blue-700 text-blue-300' 
                      : 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 text-blue-700'
                  }`}>
                    <h4 className={`font-bold mb-3 flex items-center gap-2 ${
                      darkMode ? 'text-blue-200' : 'text-blue-800'
                    }`}>
                      <span className="text-lg">ℹ️</span>
                      Map information
                    </h4>
                    <div className="text-sm space-y-2">
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>•</span>
                        <span><strong>Base map:</strong> Shows all OpenStreetMap data (buildings, streets, etc.)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>•</span>
                        <span><strong>Colored markers:</strong> Only show the facilities detected by our API within the selected radius ({radiusSettings.activeRadius === 'walking' ? `${radiusSettings.walking}m` : radiusSettings.activeRadius === 'cycling' ? `${radiusSettings.cycling/1000}km` : `${radiusSettings.driving/1000}km`})</span>
                      </div>
                      {qualityScore && getTotalVisibleMarkers(qualityScore, categoryGroups) > 80 && (
                        <div className="flex items-start gap-2">
                          <span className={`mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>•</span>
                          <span><strong>Performance mode:</strong> {getTotalVisibleMarkers(qualityScore, categoryGroups)} markers found - displayed in pages (max. 80 per page) for better performance</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>•</span>
                        <span><strong>Missing markers?</strong> Possibly incomplete OpenStreetMap data or outside the search radius</span>
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
                  radiusSettings={radiusSettings}
                />
              </div>
            </div>

          )}

        </div>
        <div className={`text-center text-xs mt-8 ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
        <p>
          Made with ❤️ in{' '}
          <a
            href={`${currentUrl}/?lat=54.095791&lng=13.3815238`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Greifswald
          </a>
        </p>
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