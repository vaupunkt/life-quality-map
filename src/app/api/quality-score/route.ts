import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // Earth radius in meters
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

// Helpfunction to normalize names for duplicate detection
function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace(/[äöüß]/g, (char) => {
      const map: {[key: string]: string} = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }
      return map[char] || char
    })
    .replace(/[^\w\s]/g, '') 
    .replace(/\s+/g, ' ') 
    .trim()
}

// Helpfunction to filter duplicates
function removeDuplicates<T extends {lat: number, lng: number, name: string}>(items: T[]): T[] {
  const filtered: T[] = []
  const duplicateThreshold = 50 
  
  for (const item of items) {
    const normalizedName = normalizeName(item.name)
    
    const isDuplicate = filtered.some(existing => {
      const existingNormalizedName = normalizeName(existing.name)
      const distance = calculateDistance(item.lat, item.lng, existing.lat, existing.lng)
      
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

async function getBundeslandFromCoordinates(lat: number, lng: number): Promise<{
  bundesland: string | null, 
  lebenszufriedenheit: number | null,
  klimadaten: {temperatur: number, niederschlag: number, sonnenschein: number} | null
}> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=5&addressdetails=1`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Lebensqualitaets-Karte/1.0'
      }
    })
    
    if (!response.ok) {
      throw new Error('Nominatim API error')
    }
    
    const data = await response.json()
    const state = data.address?.state || data.address?.city || null
    
    if (!state) {
      return { bundesland: null, lebenszufriedenheit: null, klimadaten: null }
    }
    
    const dataPath = path.join(process.cwd(), 'src/data/lebenszufriedenheit.json')
    const lebenszufriedenheitData = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
    
    const klimaPath = path.join(process.cwd(), 'src/data/klimadaten.json')
    const klimaData = JSON.parse(fs.readFileSync(klimaPath, 'utf8'))
    
    const normalizedState = state.trim()
    let lebenszufriedenheit = lebenszufriedenheitData[normalizedState] || null
    let klimadaten = klimaData[normalizedState] || null
    
    if (!lebenszufriedenheit || !klimadaten) {
      const alternatives: {[key: string]: string} = {
        'North Rhine-Westphalia': 'Nordrhein-Westfalen',
        'Rhineland-Palatinate': 'Rheinland-Pfalz',
        'Lower Saxony': 'Niedersachsen',
        'Saxony-Anhalt': 'Sachsen-Anhalt',
        'Mecklenburg-Western Pomerania': 'Mecklenburg-Vorpommern',
        'Baden-Wurttemberg': 'Baden-Württemberg',
        'Bavaria': 'Bayern',
        'Thuringia': 'Thüringen',
        'Saxony': 'Sachsen',
        'Hesse': 'Hessen'
      }
      
      const germanName = alternatives[normalizedState] || normalizedState
      lebenszufriedenheit = lebenszufriedenheitData[germanName] || null
      klimadaten = klimaData[germanName] || null
    }
    
    return {
      bundesland: normalizedState,
      lebenszufriedenheit: lebenszufriedenheit,
      klimadaten: klimadaten
    }
  } catch (error) {
    console.error('Error fetching Bundesland:', error)
    return { bundesland: null, lebenszufriedenheit: null, klimadaten: null }
  }
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
  const bundeslandInfo = await getBundeslandFromCoordinates(lat, lng)
  const searchCategories = {
    kindergarten: ['kindergarten'],
    schools: ['school'],
    supermarkets: ['supermarket', 'convenience', 'grocery', 'discount'],
    doctors: ['doctors', 'hospital', 'clinic'],
    pharmacies: ['pharmacy'],
    culture: ['cinema', 'museum', 'theatre', 'library', 'gallery', 'art_gallery', 'exhibition_centre'],
    sports: ['swimming_pool', 'fitness_centre', 'sports_centre', 'stadium', 'gym', 'fitness', 'sports_hall', 'tennis', 'golf_course', 'ice_rink', 'climbing'],
    parks: ['park', 'playground', 'garden'],
    transport: ['bus_stop', 'station', 'tram_stop', 'subway_entrance'],
    cycling: ['bicycle_rental', 'bicycle_repair_station', 'cycleway', 'bicycle_parking', 'bike_lane', 'bicycle_road', 'designated_path'],
    restaurants: ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'ice_cream'],
    shopping: ['bakery', 'butcher', 'clothes', 'mall', 'department_store'],
    finance: ['bank', 'atm'],
    safety: ['police', 'fire_station'],
    services: ['post_office', 'fuel'],
    education: ['university', 'college'],
    hairdresser: ['hairdresser', 'beauty']
  }

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
    cycling: 0,
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
    cycling: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    restaurants: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    shopping: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    finance: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    safety: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    services: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    education: [] as Array<{lat: number, lng: number, name: string, type: string}>,
    hairdresser: [] as Array<{lat: number, lng: number, name: string, type: string}>
  }

  try {
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
        
        // Kultur und Freizeit (inkl. Galerien)
        nwr["amenity"~"^(cinema|theatre|library|art_gallery)$"](around:${radius},${lat},${lng});
        nwr["tourism"~"^(museum|gallery|art_gallery|exhibition_centre)$"](around:${radius},${lat},${lng});
        // Sport und Fitness (erweitert)
        nwr["leisure"~"^(swimming_pool|fitness_centre|sports_centre|stadium|sports_hall|ice_rink|golf_course|climbing)$"](around:${radius},${lat},${lng});
        nwr["amenity"~"^(gym|fitness)$"](around:${radius},${lat},${lng});
        nwr["sport"~"^(tennis|calisthenics|fitness|climbing|swimming)$"](around:${radius},${lat},${lng});
        
        // Parks und Grünflächen
        nwr["leisure"~"^(park|playground|garden)$"](around:${radius},${lat},${lng});
        nwr["landuse"="recreation_ground"](around:${radius},${lat},${lng});
        
        // Öffentlicher Verkehr
        nwr["highway"="bus_stop"](around:${radius},${lat},${lng});
        nwr["railway"~"^(station|tram_stop|subway_entrance)$"](around:${radius},${lat},${lng});
        nwr["public_transport"](around:${radius},${lat},${lng});
        
        // Fahrradinfrastruktur (erweitert)
        nwr["highway"="cycleway"](around:${radius},${lat},${lng});
        nwr["cycleway"](around:${radius},${lat},${lng});
        nwr["cycleway:left"](around:${radius},${lat},${lng});
        nwr["cycleway:right"](around:${radius},${lat},${lng});
        nwr["cycleway:both"](around:${radius},${lat},${lng});
        nwr["bicycle_road"="yes"](around:${radius},${lat},${lng});
        nwr["bicycle"="designated"](around:${radius},${lat},${lng});
        nwr["highway"="path"]["bicycle"="yes"](around:${radius},${lat},${lng});
        nwr["highway"="path"]["bicycle"="designated"](around:${radius},${lat},${lng});
        nwr["amenity"~"^(bicycle_rental|bicycle_repair_station|bicycle_parking)$"](around:${radius},${lat},${lng});
        
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
    
    data.elements?.forEach((element: any) => {
      const elementLat = element.lat || (element.center ? element.center.lat : null)
      const elementLng = element.lon || (element.center ? element.center.lon : null)
      const name = element.tags?.name || element.tags?.brand || 'Unbekannt'
      
      if (!elementLat || !elementLng) return

      const distance = calculateDistance(lat, lng, elementLat, elementLng)
      if (distance > radius) return

      const tags = element.tags || {}

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
      
      if (['cinema', 'theatre', 'library'].includes(tags.amenity) || 
          tags.tourism === 'museum' ||
          ['gallery', 'art_gallery', 'exhibition_centre'].includes(tags.tourism) || 
          tags.amenity === 'art_gallery') {
        amenityCounts.culture++
        const type = tags.amenity || tags.tourism || 'culture'
        amenityDetails.culture.push({ lat: elementLat, lng: elementLng, name, type })
      }
      
      if (['swimming_pool', 'fitness_centre', 'sports_centre', 'stadium', 'sports_hall', 'ice_rink', 'golf_course', 'climbing'].includes(tags.leisure) ||
          ['gym', 'fitness'].includes(tags.amenity) ||
          ['tennis', 'calisthenics', 'fitness', 'climbing', 'swimming'].includes(tags.sport)) {
        amenityCounts.sports++
        const type = tags.leisure || tags.amenity || tags.sport || 'sports'
        amenityDetails.sports.push({ lat: elementLat, lng: elementLng, name, type })
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
      
      if (['bicycle_rental', 'bicycle_repair_station'].includes(tags.amenity) || 
          tags.highway === 'cycleway' || 
          tags.amenity === 'bicycle_parking' ||
          tags.cycleway ||
          tags['cycleway:left'] ||
          tags['cycleway:right'] ||
          tags['cycleway:both'] ||
          tags.bicycle_road === 'yes' ||
          tags.bicycle === 'designated' ||
          (tags.highway === 'path' && (tags.bicycle === 'yes' || tags.bicycle === 'designated'))) {
        amenityCounts.cycling++
        let type = 'cycling'
        if (tags.highway === 'cycleway') type = 'cycleway'
        else if (tags.cycleway || tags['cycleway:left'] || tags['cycleway:right'] || tags['cycleway:both']) type = 'bike_lane'
        else if (tags.bicycle_road === 'yes') type = 'bicycle_road'
        else if (tags.bicycle === 'designated') type = 'designated_path'
        else if (tags.amenity) type = tags.amenity
        amenityDetails.cycling.push({ lat: elementLat, lng: elementLng, name, type })
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
      
      if (['hairdresser', 'beauty'].includes(tags.shop) || tags.amenity === 'hairdresser') {
        amenityCounts.hairdresser++
        const type = tags.shop || tags.amenity || 'hairdresser'
        amenityDetails.hairdresser.push({ lat: elementLat, lng: elementLng, name, type })
      }
      
      if (['university', 'college'].includes(tags.amenity)) {
        amenityCounts.education++
        amenityDetails.education.push({ lat: elementLat, lng: elementLng, name, type: tags.amenity })
      }
    })

    amenityDetails.kindergartens = removeDuplicates(amenityDetails.kindergartens)
    amenityDetails.schools = removeDuplicates(amenityDetails.schools)
    amenityDetails.supermarkets = removeDuplicates(amenityDetails.supermarkets)
    amenityDetails.doctors = removeDuplicates(amenityDetails.doctors)
    amenityDetails.pharmacies = removeDuplicates(amenityDetails.pharmacies)
    amenityDetails.culture = removeDuplicates(amenityDetails.culture)
    amenityDetails.sports = removeDuplicates(amenityDetails.sports)
    amenityDetails.parks = removeDuplicates(amenityDetails.parks)
    amenityDetails.transport = removeDuplicates(amenityDetails.transport)
    amenityDetails.cycling = removeDuplicates(amenityDetails.cycling)
    amenityDetails.restaurants = removeDuplicates(amenityDetails.restaurants)
    amenityDetails.shopping = removeDuplicates(amenityDetails.shopping)
    amenityDetails.finance = removeDuplicates(amenityDetails.finance)
    amenityDetails.safety = removeDuplicates(amenityDetails.safety)
    amenityDetails.services = removeDuplicates(amenityDetails.services)
    amenityDetails.education = removeDuplicates(amenityDetails.education)
    amenityDetails.hairdresser = removeDuplicates(amenityDetails.hairdresser)

    amenityCounts.kindergarten = amenityDetails.kindergartens.length
    amenityCounts.school = amenityDetails.schools.length
    amenityCounts.supermarket = amenityDetails.supermarkets.length
    amenityCounts.doctors = amenityDetails.doctors.length
    amenityCounts.pharmacy = amenityDetails.pharmacies.length
    amenityCounts.culture = amenityDetails.culture.length
    amenityCounts.sports = amenityDetails.sports.length
    amenityCounts.parks = amenityDetails.parks.length
    amenityCounts.transport = amenityDetails.transport.length
    amenityCounts.cycling = amenityDetails.cycling.length
    amenityCounts.restaurants = amenityDetails.restaurants.length
    amenityCounts.shopping = amenityDetails.shopping.length
    amenityCounts.finance = amenityDetails.finance.length
    amenityCounts.safety = amenityDetails.safety.length
    amenityCounts.services = amenityDetails.services.length
    amenityCounts.education = amenityDetails.education.length
    amenityCounts.hairdresser = amenityDetails.hairdresser.length

    const kindergartenScore = Math.min(10, Math.round(amenityCounts.kindergarten * 2))
    const schoolScore = Math.min(10, Math.round(amenityCounts.school * 2))
    const supermarketScore = Math.min(10, Math.round(amenityCounts.supermarket * 1.5))
    const doctorScore = Math.min(10, Math.round((amenityCounts.doctors + amenityCounts.hospital) * 1.5))
    const pharmacyScore = Math.min(10, Math.round(amenityCounts.pharmacy * 2))
    const cultureScore = Math.min(10, Math.round(amenityCounts.culture * 1.5))
    const sportsScore = Math.min(10, Math.round(amenityCounts.sports * 1.5))
    const parksScore = Math.min(10, Math.round(amenityCounts.parks * 1.5))
    const transportScore = Math.min(10, Math.round(amenityCounts.transport * 0.5))
    const cyclingScore = Math.min(10, Math.round(amenityCounts.cycling * 1.5))
    const restaurantScore = Math.min(10, Math.round(amenityCounts.restaurants * 1.0))
    const shoppingScore = Math.min(10, Math.round(amenityCounts.shopping * 1.0))
    const financeScore = Math.min(10, Math.round(amenityCounts.finance * 1.5))
    const safetyScore = Math.min(10, Math.round(amenityCounts.safety * 2))
    const servicesScore = Math.min(10, Math.round(amenityCounts.services * 1.5))
    const educationScore = Math.min(10, Math.round(amenityCounts.education * 1.5))
    const hairdresserScore = Math.min(10, Math.round(amenityCounts.hairdresser * 2))

    
    const klimaScores = calculateClimaScore(bundeslandInfo.klimadaten)
    const { temperaturScore, niederschlagScore, sonnenscheinScore, klimaScore } = klimaScores

    const noiseScore = Math.floor(Math.random() * 5) + 3 
    const trafficScore = Math.floor(Math.random() * 5) + 3 

    let overallScore = 0
    let totalWeight = 0
    
    if (categoryGroups && categoryVisibility) {
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
            case 'cycling': score = cyclingScore; break
            case 'restaurants': score = restaurantScore; break
            case 'shopping': score = shoppingScore; break
            case 'finance': score = financeScore; break
            case 'safety': score = safetyScore; break
            case 'services': score = servicesScore; break
            case 'education': score = educationScore; break
            case 'hairdresser': score = hairdresserScore; break
          }
          
          overallScore += score * finalWeight
          totalWeight += finalWeight
        })
      })
      
      overallScore += (10 - noiseScore) * 0.03 * totalWeight
      overallScore += (10 - trafficScore) * 0.03 * totalWeight
      
      if (bundeslandInfo.lebenszufriedenheit) {
        const lifeSatisfactionScore = Math.round((bundeslandInfo.lebenszufriedenheit / 10) * 10) 
        overallScore += lifeSatisfactionScore * 0.1 * totalWeight
        totalWeight += 0.1 * totalWeight
      }
      
      totalWeight += 0.06 * totalWeight
      
      overallScore = totalWeight > 0 ? Math.round(overallScore / totalWeight) : 0
    } else {
      let baseScore = (kindergartenScore * 0.07 + 
         schoolScore * 0.07 + 
         supermarketScore * 0.07 + 
         doctorScore * 0.07 + 
         pharmacyScore * 0.05 + 
         cultureScore * 0.13 +
         sportsScore * 0.07 +
         parksScore * 0.07 +
         transportScore * 0.07 +
         cyclingScore * 0.06 +
         restaurantScore * 0.05 +
         shoppingScore * 0.05 +
         financeScore * 0.04 +
         safetyScore * 0.04 +
         servicesScore * 0.04 +
         educationScore * 0.05 +
         hairdresserScore * 0.03 +
         (10 - noiseScore) * 0.02 + 
         (10 - trafficScore) * 0.02)
      
      if (bundeslandInfo.lebenszufriedenheit) {
        const lifeSatisfactionScore = Math.round((bundeslandInfo.lebenszufriedenheit / 10) * 10) 
        baseScore = baseScore * 0.9 + lifeSatisfactionScore * 0.1
      }
      
      overallScore = Math.round(baseScore)
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
      cycling: cyclingScore,
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
      bundesland: bundeslandInfo.bundesland,
      lebenszufriedenheit: bundeslandInfo.lebenszufriedenheit,
      klimadaten: bundeslandInfo.klimadaten,
      klimaScore: klimaScore,
      temperatur: temperaturScore,
      niederschlag: niederschlagScore,
      sonnenschein: sonnenscheinScore,
    }
  } catch (error) {
    console.error('Overpass API error:', error)
    
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
      bundesland: null,
      lebenszufriedenheit: null,
      klimadaten: null,
      klimaScore: 5,
      temperatur: 5,
      niederschlag: 5,
      sonnenschein: 5,
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

function calculateClimaScore(klimadaten: {temperatur: number, niederschlag: number, sonnenschein: number} | null): {
  temperaturScore: number,
  niederschlagScore: number,
  sonnenscheinScore: number,
  klimaScore: number
} {
  if (!klimadaten) {
    return { temperaturScore: 5, niederschlagScore: 5, sonnenscheinScore: 5, klimaScore: 5 }
  }

  let temperaturScore = 10
  const idealTemp = 11 
  const tempDiff = Math.abs(klimadaten.temperatur - idealTemp)
  
  if (klimadaten.temperatur < 7) {
    temperaturScore = Math.max(0, 3 - (7 - klimadaten.temperatur) * 0.8)
  } else if (klimadaten.temperatur > 16) {
    temperaturScore = Math.max(0, 3 - (klimadaten.temperatur - 16) * 0.7)
  } else if (tempDiff <= 2) {
    temperaturScore = 10 - tempDiff * 1.5
  } else {
    temperaturScore = Math.max(1, 7 - (tempDiff - 2) * 2.5)
  }

  let niederschlagScore = 10
  const idealNiederschlag = 800
  const niederschlagDiff = Math.abs(klimadaten.niederschlag - idealNiederschlag)
  
  if (klimadaten.niederschlag < 500) {
    niederschlagScore = Math.max(0, 2 - (500 - klimadaten.niederschlag) / 100)
  } else if (klimadaten.niederschlag > 1200) {
    niederschlagScore = Math.max(0, 2 - (klimadaten.niederschlag - 1200) / 150)
  } else if (niederschlagDiff <= 50) {
    niederschlagScore = 10 - niederschlagDiff / 25
  } else if (niederschlagDiff <= 150) {
    
    niederschlagScore = Math.max(3, 8 - (niederschlagDiff - 50) / 20)
  } else {
    
    niederschlagScore = Math.max(1, 3 - (niederschlagDiff - 150) / 50)
  }
  
  let sonnenscheinScore = 10
  const idealSonnenschein = 1700
  const sonnenscheinDiff = Math.abs(klimadaten.sonnenschein - idealSonnenschein)
  
  if (klimadaten.sonnenschein < 1200) {
    
    sonnenscheinScore = Math.max(1, (klimadaten.sonnenschein / 1200) * 6)
  } else if (klimadaten.sonnenschein > 2200) {
    
    sonnenscheinScore = Math.max(2, 8 - (klimadaten.sonnenschein - 2200) / 100)
  } else if (sonnenscheinDiff <= 100) {
    
    sonnenscheinScore = 10 - sonnenscheinDiff / 50
  } else {
    
    sonnenscheinScore = Math.max(3, 8 - (sonnenscheinDiff - 100) / 80)
  }

  const gewichteterScore = (temperaturScore * 0.45 + niederschlagScore * 0.35 + sonnenscheinScore * 0.2)
  
  let extremePenalty = 0
  if ((klimadaten.temperatur < 8 || klimadaten.temperatur > 15) && 
      (klimadaten.niederschlag < 600 || klimadaten.niederschlag > 1100)) {
    extremePenalty = 1.5 
  }
  
  const klimaScore = Math.round(Math.max(0, gewichteterScore - extremePenalty))

  return {
    temperaturScore: Math.round(Math.max(0, Math.min(10, temperaturScore))),
    niederschlagScore: Math.round(Math.max(0, Math.min(10, niederschlagScore))),
    sonnenscheinScore: Math.round(Math.max(0, Math.min(10, sonnenscheinScore))),
    klimaScore: Math.max(0, Math.min(10, klimaScore))
  }
}
