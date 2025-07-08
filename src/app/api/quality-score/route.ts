import { NextRequest, NextResponse } from 'next/server'

// Hilfsfunktion zur Berechnung der Entfernung zwischen zwei Punkten in Metern
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // Erdradius in Metern
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}

// Hilfsfunktion zur Normalisierung von Namen für Duplikat-Erkennung
function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace(/[äöüß]/g, (char) => {
      const map: {[key: string]: string} = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }
      return map[char] || char
    })
    .replace(/[^\w\s]/g, '') // Entferne Sonderzeichen
    .replace(/\s+/g, ' ')   // Mehrere Leerzeichen zu einem
    .trim()
}

// Hilfsfunktion zur Duplikat-Filterung
function removeDuplicates<T extends {lat: number, lng: number, name: string}>(items: T[]): T[] {
  const filtered: T[] = []
  const duplicateThreshold = 50 // 50 Meter Mindestabstand
  
  for (const item of items) {
    const normalizedName = normalizeName(item.name)
    
    // Prüfe ob bereits ein ähnliches Element existiert
    const isDuplicate = filtered.some(existing => {
      const existingNormalizedName = normalizeName(existing.name)
      const distance = calculateDistance(item.lat, item.lng, existing.lat, existing.lng)
      
      // Duplikat wenn: gleicher Name ODER sehr nah beieinander (< 50m) mit ähnlichem Namen
      const sameOrSimilarName = existingNormalizedName === normalizedName || 
                               (distance < duplicateThreshold && 
                                (existingNormalizedName.includes(normalizedName) || 
                                 normalizedName.includes(existingNormalizedName)))
      
      return sameOrSimilarName && distance < duplicateThreshold
    })
    
    if (!isDuplicate) {
      filtered.push(item)
    }
  }
  
  return filtered
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, address, radius = 1000, categoryGroups, categoryVisibility } = await request.json()

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Koordinaten sind erforderlich' }, { status: 400 })
    }

    // Calculate quality score based on nearby amenities
    const qualityScore = await calculateQualityScore(lat, lng, address, radius, categoryGroups, categoryVisibility)

    return NextResponse.json(qualityScore)
  } catch (error) {
    console.error('Quality score calculation error:', error)
    return NextResponse.json({ error: 'Fehler bei der Berechnung des Qualitäts-Scores' }, { status: 500 })
  }
}

async function calculateQualityScore(
  lat: number, 
  lng: number, 
  address: string, 
  radius: number = 1500,
  categoryGroups?: any,
  categoryVisibility?: any
) {
  // Definiere die Suchkategorien mit ihren OpenStreetMap-Tags
  const searchCategories = {
    kindergarten: ['kindergarten'],
    schools: ['school'],
    supermarkets: ['supermarket', 'convenience', 'grocery', 'discount'],
    doctors: ['doctors', 'hospital', 'clinic'],
    pharmacies: ['pharmacy'],
    culture: ['cinema', 'museum', 'theatre', 'library'],
    sports: ['swimming_pool', 'fitness_centre', 'sports_centre', 'stadium'],
    parks: ['park', 'playground', 'garden'],
    transport: ['bus_stop', 'station', 'tram_stop', 'subway_entrance'],
    restaurants: ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'ice_cream'],
    shopping: ['bakery', 'butcher', 'clothes', 'mall', 'department_store'],
    finance: ['bank', 'atm'],
    safety: ['police', 'fire_station'],
    services: ['post_office', 'fuel', 'hairdresser'],
    education: ['university', 'college']
  }

  // Initialisiere die Ergebnisse
  const amenityCounts = {
    kindergarten: 0,
    school: 0,
    supermarket: 0,
    doctors: 0,
    hospital: 0,
    pharmacy: 0,
    culture: 0,
    sports: 0,
    parks: 0,
    transport: 0,
    restaurants: 0,
    shopping: 0,
    finance: 0,
    safety: 0,
    services: 0,
    education: 0,
    hairdresser: 0
  }

  const amenityDetails = {
    kindergartens: [] as Array<{lat: number, lng: number, name: string}>,
    schools: [] as Array<{lat: number, lng: number, name: string}>,
    supermarkets: [] as Array<{lat: number, lng: number, name: string}>,
    doctors: [] as Array<{lat: number, lng: number, name: string}>,
    pharmacies: [] as Array<{lat: number, lng: number, name: string}>,
    culture: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    sports: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    parks: [] as Array<{lat: number, lng: number, name: string}>,
    transport: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    restaurants: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    shopping: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    finance: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    safety: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    services: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    education: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    hairdresser: [] as Array<{lat: number, lng: number, name: string}>
  }

  try {
    // Erweiterte Overpass-Abfrage mit verbesserter Syntax
    const overpassQuery = `
      [out:json][timeout:30];
      (
        // Restaurants mit allen Varianten
        nwr["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream)$"](around:${radius},${lat},${lng});
        
        // Schulen mit erweiterten Kriterien
        nwr["amenity"="school"](around:${radius},${lat},${lng});
        nwr["amenity"="kindergarten"](around:${radius},${lat},${lng});
        nwr["building"="school"](around:${radius},${lat},${lng});
        
        // Supermärkte und Geschäfte
        nwr["shop"~"^(supermarket|convenience|grocery|discount)$"](around:${radius},${lat},${lng});
        
        // Gesundheitswesen
        nwr["amenity"~"^(doctors|hospital|clinic|pharmacy)$"](around:${radius},${lat},${lng});
        nwr["healthcare"](around:${radius},${lat},${lng});
        
        // Kultur und Freizeit
        nwr["amenity"~"^(cinema|theatre|library)$"](around:${radius},${lat},${lng});
        nwr["tourism"="museum"](around:${radius},${lat},${lng});
        nwr["leisure"~"^(swimming_pool|fitness_centre|sports_centre|stadium)$"](around:${radius},${lat},${lng});
        
        // Parks und Grünflächen
        nwr["leisure"~"^(park|playground|garden)$"](around:${radius},${lat},${lng});
        nwr["landuse"="recreation_ground"](around:${radius},${lat},${lng});
        
        // Öffentlicher Verkehr
        nwr["highway"="bus_stop"](around:${radius},${lat},${lng});
        nwr["railway"~"^(station|tram_stop|subway_entrance)$"](around:${radius},${lat},${lng});
        nwr["public_transport"](around:${radius},${lat},${lng});
        
        // Shopping
        nwr["shop"~"^(bakery|butcher|clothes|mall|department_store)$"](around:${radius},${lat},${lng});
        
        // Finanzdienstleistungen
        nwr["amenity"~"^(bank|atm)$"](around:${radius},${lat},${lng});
        
        // Sicherheit
        nwr["amenity"~"^(police|fire_station)$"](around:${radius},${lat},${lng});
        
        // Services
        nwr["amenity"~"^(post_office|fuel)$"](around:${radius},${lat},${lng});
        nwr["shop"="hairdresser"](around:${radius},${lat},${lng});
        
        // Bildung
        nwr["amenity"~"^(university|college)$"](around:${radius},${lat},${lng});
      );
      out center meta;
    `

    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'LebensqualitaetsKarte/1.0'
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    })

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Verarbeite die Ergebnisse
    data.elements?.forEach((element: any) => {
      const elementLat = element.lat || (element.center ? element.center.lat : null)
      const elementLng = element.lon || (element.center ? element.center.lon : null)
      const name = element.tags?.name || element.tags?.brand || 'Unbekannt'
      
      if (!elementLat || !elementLng) return

      // Überprüfe Entfernung zum Suchpunkt
      const distance = calculateDistance(lat, lng, elementLat, elementLng)
      if (distance > radius) return

      const tags = element.tags || {}

      // Kategorisierung basierend auf Tags
      if (tags.amenity === 'kindergarten') {
        amenityCounts.kindergarten++
        amenityDetails.kindergartens.push({ lat: elementLat, lng: elementLng, name })
      }
      
      if (tags.amenity === 'school' || tags.building === 'school') {
        amenityCounts.school++
        amenityDetails.schools.push({ lat: elementLat, lng: elementLng, name })
      }
      
      if (['supermarket', 'convenience', 'grocery', 'discount'].includes(tags.shop)) {
        amenityCounts.supermarket++
        amenityDetails.supermarkets.push({ lat: elementLat, lng: elementLng, name })
      }
      
      if (['doctors', 'hospital', 'clinic'].includes(tags.amenity) || tags.healthcare) {
        amenityCounts.doctors++
        amenityDetails.doctors.push({ lat: elementLat, lng: elementLng, name })
      }
      
      if (tags.amenity === 'pharmacy') {
        amenityCounts.pharmacy++
        amenityDetails.pharmacies.push({ lat: elementLat, lng: elementLng, name })
      }
      
      if (['cinema', 'theatre', 'library'].includes(tags.amenity) || tags.tourism === 'museum') {
        amenityCounts.culture++
        const type = tags.amenity || tags.tourism || 'culture'
        amenityDetails.culture.push({ lat: elementLat, lng: elementLng, name, type })
      }
      
      if (['swimming_pool', 'fitness_centre', 'sports_centre', 'stadium'].includes(tags.leisure)) {
        amenityCounts.sports++
        amenityDetails.sports.push({ lat: elementLat, lng: elementLng, name, type: tags.leisure })
      }
      
      if (['park', 'playground', 'garden'].includes(tags.leisure) || tags.landuse === 'recreation_ground') {
        amenityCounts.parks++
        amenityDetails.parks.push({ lat: elementLat, lng: elementLng, name })
      }
      
      if (tags.highway === 'bus_stop' || ['station', 'tram_stop', 'subway_entrance'].includes(tags.railway) || tags.public_transport) {
        amenityCounts.transport++
        const type = tags.highway || tags.railway || tags.public_transport || 'transport'
        amenityDetails.transport.push({ lat: elementLat, lng: elementLng, name, type })
      }
      
      if (['restaurant', 'cafe', 'fast_food', 'bar', 'pub'].includes(tags.amenity)) {
        amenityCounts.restaurants++
        amenityDetails.restaurants.push({ lat: elementLat, lng: elementLng, name, type: tags.amenity })
      }
      
      if (['bakery', 'butcher', 'clothes', 'mall', 'department_store'].includes(tags.shop)) {
        amenityCounts.shopping++
        amenityDetails.shopping.push({ lat: elementLat, lng: elementLng, name, type: tags.shop })
      }
      
      if (['bank', 'atm'].includes(tags.amenity)) {
        amenityCounts.finance++
        amenityDetails.finance.push({ lat: elementLat, lng: elementLng, name, type: tags.amenity })
      }
      
      if (['police', 'fire_station'].includes(tags.amenity)) {
        amenityCounts.safety++
        amenityDetails.safety.push({ lat: elementLat, lng: elementLng, name, type: tags.amenity })
      }
      
      if (['post_office', 'fuel'].includes(tags.amenity)) {
        amenityCounts.services++
        amenityDetails.services.push({ lat: elementLat, lng: elementLng, name, type: tags.amenity })
      }
      
      if (tags.shop === 'hairdresser') {
        amenityCounts.hairdresser++
        amenityDetails.hairdresser.push({ lat: elementLat, lng: elementLng, name })
      }
      
      if (['university', 'college'].includes(tags.amenity)) {
        amenityCounts.education++
        amenityDetails.education.push({ lat: elementLat, lng: elementLng, name, type: tags.amenity })
      }
    })

    // Duplikat-Filterung anwenden
    amenityDetails.kindergartens = removeDuplicates(amenityDetails.kindergartens)
    amenityDetails.schools = removeDuplicates(amenityDetails.schools)
    amenityDetails.supermarkets = removeDuplicates(amenityDetails.supermarkets)
    amenityDetails.doctors = removeDuplicates(amenityDetails.doctors)
    amenityDetails.pharmacies = removeDuplicates(amenityDetails.pharmacies)
    amenityDetails.culture = removeDuplicates(amenityDetails.culture)
    amenityDetails.sports = removeDuplicates(amenityDetails.sports)
    amenityDetails.parks = removeDuplicates(amenityDetails.parks)
    amenityDetails.transport = removeDuplicates(amenityDetails.transport)
    amenityDetails.restaurants = removeDuplicates(amenityDetails.restaurants)
    amenityDetails.shopping = removeDuplicates(amenityDetails.shopping)
    amenityDetails.finance = removeDuplicates(amenityDetails.finance)
    amenityDetails.safety = removeDuplicates(amenityDetails.safety)
    amenityDetails.services = removeDuplicates(amenityDetails.services)
    amenityDetails.education = removeDuplicates(amenityDetails.education)
    amenityDetails.hairdresser = removeDuplicates(amenityDetails.hairdresser)

    // Aktualisiere die Zähler basierend auf den gefilterten Daten
    amenityCounts.kindergarten = amenityDetails.kindergartens.length
    amenityCounts.school = amenityDetails.schools.length
    amenityCounts.supermarket = amenityDetails.supermarkets.length
    amenityCounts.doctors = amenityDetails.doctors.length
    amenityCounts.pharmacy = amenityDetails.pharmacies.length
    amenityCounts.culture = amenityDetails.culture.length
    amenityCounts.sports = amenityDetails.sports.length
    amenityCounts.parks = amenityDetails.parks.length
    amenityCounts.transport = amenityDetails.transport.length
    amenityCounts.restaurants = amenityDetails.restaurants.length
    amenityCounts.shopping = amenityDetails.shopping.length
    amenityCounts.finance = amenityDetails.finance.length
    amenityCounts.safety = amenityDetails.safety.length
    amenityCounts.services = amenityDetails.services.length
    amenityCounts.education = amenityDetails.education.length
    amenityCounts.hairdresser = amenityDetails.hairdresser.length

    // Calculate scores (0-10 scale)
    const kindergartenScore = Math.min(10, Math.round(amenityCounts.kindergarten * 2))
    const schoolScore = Math.min(10, Math.round(amenityCounts.school * 2))
    const supermarketScore = Math.min(10, Math.round(amenityCounts.supermarket * 1.5))
    const doctorScore = Math.min(10, Math.round((amenityCounts.doctors + amenityCounts.hospital) * 1.5))
    const pharmacyScore = Math.min(10, Math.round(amenityCounts.pharmacy * 2))
    const cultureScore = Math.min(10, Math.round(amenityCounts.culture * 1.5))
    const sportsScore = Math.min(10, Math.round(amenityCounts.sports * 1.5))
    const parksScore = Math.min(10, Math.round(amenityCounts.parks * 1.5))
    const transportScore = Math.min(10, Math.round(amenityCounts.transport * 0.5))
    const restaurantScore = Math.min(10, Math.round(amenityCounts.restaurants * 1.0))
    const shoppingScore = Math.min(10, Math.round(amenityCounts.shopping * 1.0))
    const financeScore = Math.min(10, Math.round(amenityCounts.finance * 1.5))
    const safetyScore = Math.min(10, Math.round(amenityCounts.safety * 2))
    const servicesScore = Math.min(10, Math.round(amenityCounts.services * 1.5))
    const educationScore = Math.min(10, Math.round(amenityCounts.education * 1.5))
    const hairdresserScore = Math.min(10, Math.round(amenityCounts.hairdresser * 2))

    // Mock scores for noise and traffic (would need specialized APIs)
    const noiseScore = Math.floor(Math.random() * 5) + 3 // 3-7 range
    const trafficScore = Math.floor(Math.random() * 5) + 3 // 3-7 range

    // Calculate overall score (weighted average based on enabled categories and their weights)
    let overallScore = 0
    let totalWeight = 0
    
    if (categoryGroups && categoryVisibility) {
      // Dynamische Berechnung basierend auf aktivierten Kategorien und Gewichtungen
      Object.values(categoryGroups).forEach((group: any) => {
        if (!group.enabled) return
        
        const groupWeight = group.weight || 1.0
        
        group.categories.forEach((category: any) => {
          if (!category.enabled || !categoryVisibility[category.key]) return
          
          const categoryWeight = category.weight || 1.0
          const finalWeight = groupWeight * categoryWeight
          
          let score = 0
          switch(category.key) {
            case 'kindergarten': score = kindergartenScore; break
            case 'schools': score = schoolScore; break
            case 'supermarkets': score = supermarketScore; break
            case 'doctors': score = doctorScore; break
            case 'pharmacies': score = pharmacyScore; break
            case 'culture': score = cultureScore; break
            case 'sports': score = sportsScore; break
            case 'parks': score = parksScore; break
            case 'transport': score = transportScore; break
            case 'restaurants': score = restaurantScore; break
            case 'shopping': score = shoppingScore; break
            case 'finance': score = financeScore; break
            case 'safety': score = safetyScore; break
            case 'services': score = servicesScore; break
            case 'education': score = educationScore; break
          }
          
          overallScore += score * finalWeight
          totalWeight += finalWeight
        })
      })
      
      // Lärm- und Verkehrsbelastung immer berücksichtigen (negative Faktoren)
      overallScore += (10 - noiseScore) * 0.03 * totalWeight
      overallScore += (10 - trafficScore) * 0.03 * totalWeight
      totalWeight += 0.06 * totalWeight
      
      overallScore = totalWeight > 0 ? Math.round(overallScore / totalWeight) : 0
    } else {
      // Fallback: Original-Berechnung
      overallScore = Math.round(
        (kindergartenScore * 0.08 + 
         schoolScore * 0.08 + 
         supermarketScore * 0.08 + 
         doctorScore * 0.08 + 
         pharmacyScore * 0.06 + 
         cultureScore * 0.1 +
         sportsScore * 0.08 +
         parksScore * 0.08 +
         transportScore * 0.08 +
         restaurantScore * 0.06 +
         shoppingScore * 0.06 +
         financeScore * 0.05 +
         safetyScore * 0.05 +
         servicesScore * 0.04 +
         educationScore * 0.06 +
         (10 - noiseScore) * 0.03 + 
         (10 - trafficScore) * 0.03) 
      )
    }

    return {
      overall: overallScore,
      kindergarten: kindergartenScore,
      schools: schoolScore,
      supermarkets: supermarketScore,
      doctors: doctorScore,
      pharmacies: pharmacyScore,
      culture: cultureScore,
      sports: sportsScore,
      parks: parksScore,
      transport: transportScore,
      restaurants: restaurantScore,
      shopping: shoppingScore,
      finance: financeScore,
      safety: safetyScore,
      services: servicesScore,
      education: educationScore,
      hairdresser: hairdresserScore,
      noise: noiseScore,
      traffic: trafficScore,
      address: address,
      lat: lat,
      lng: lng,
      amenities: amenityDetails,
    }
  } catch (error) {
    console.error('Overpass API error:', error)
    
    // Fallback with mock data if API fails
    return {
      overall: 6,
      kindergarten: 5,
      schools: 7,
      supermarkets: 8,
      doctors: 6,
      pharmacies: 7,
      culture: 6,
      sports: 5,
      parks: 7,
      transport: 6,
      restaurants: 7,
      shopping: 6,
      finance: 5,
      safety: 8,
      services: 6,
      education: 7,
      hairdresser: 5,
      noise: 4,
      traffic: 5,
      address: address,
      lat: lat,
      lng: lng,
      amenities: {
        kindergartens: [],
        schools: [],
        supermarkets: [],
        doctors: [],
        pharmacies: [],
        culture: [],
        sports: [],
        parks: [],
        transport: [],
        restaurants: [],
        shopping: [],
        finance: [],
        safety: [],
        services: [],
        education: [],
        hairdresser: []
      },
    }
  }
}
