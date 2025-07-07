import { NextRequest, NextResponse } from 'next/server'

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
  radius: number = 1000,
  categoryGroups?: any,
  categoryVisibility?: any
) {
  // Build Overpass API query to find nearby amenities
  const overpassQuery = `
    [out:json][timeout:25];
    (
      // Kindergärten
      node["amenity"="kindergarten"](around:${radius},${lat},${lng});
      way["amenity"="kindergarten"](around:${radius},${lat},${lng});
      relation["amenity"="kindergarten"](around:${radius},${lat},${lng});
      
      // Schulen (alle Schularten)
      node["amenity"="school"](around:${radius},${lat},${lng});
      way["amenity"="school"](around:${radius},${lat},${lng});
      relation["amenity"="school"](around:${radius},${lat},${lng});
      
      // Grundschulen spezifisch
      node["amenity"="school"]["school"="primary"](around:${radius},${lat},${lng});
      way["amenity"="school"]["school"="primary"](around:${radius},${lat},${lng});
      
      // Weiterführende Schulen
      node["amenity"="school"]["school"="secondary"](around:${radius},${lat},${lng});
      way["amenity"="school"]["school"="secondary"](around:${radius},${lat},${lng});
      
      // Gymnasien
      node["amenity"="school"]["school"="gymnasium"](around:${radius},${lat},${lng});
      way["amenity"="school"]["school"="gymnasium"](around:${radius},${lat},${lng});
      
      // Supermärkte (erweiterte Suche)
      node["shop"="supermarket"](around:${radius},${lat},${lng});
      way["shop"="supermarket"](around:${radius},${lat},${lng});
      relation["shop"="supermarket"](around:${radius},${lat},${lng});
      
      // Weitere Lebensmittelgeschäfte
      node["shop"="convenience"](around:${radius},${lat},${lng});
      way["shop"="convenience"](around:${radius},${lat},${lng});
      node["shop"="grocery"](around:${radius},${lat},${lng});
      way["shop"="grocery"](around:${radius},${lat},${lng});
      
      // Discounter
      node["shop"="discount"](around:${radius},${lat},${lng});
      way["shop"="discount"](around:${radius},${lat},${lng});
      
      // Ärzte
      node["amenity"="doctors"](around:${radius},${lat},${lng});
      way["amenity"="doctors"](around:${radius},${lat},${lng});
      relation["amenity"="doctors"](around:${radius},${lat},${lng});
      
      node["amenity"="hospital"](around:${radius},${lat},${lng});
      way["amenity"="hospital"](around:${radius},${lat},${lng});
      relation["amenity"="hospital"](around:${radius},${lat},${lng});
      
      // Apotheken
      node["amenity"="pharmacy"](around:${radius},${lat},${lng});
      way["amenity"="pharmacy"](around:${radius},${lat},${lng});
      relation["amenity"="pharmacy"](around:${radius},${lat},${lng});
      
      // Freizeit & Kultur
      node["amenity"="cinema"](around:${radius},${lat},${lng});
      way["amenity"="cinema"](around:${radius},${lat},${lng});
      node["tourism"="museum"](around:${radius},${lat},${lng});
      way["tourism"="museum"](around:${radius},${lat},${lng});
      node["amenity"="theatre"](around:${radius},${lat},${lng});
      way["amenity"="theatre"](around:${radius},${lat},${lng});
      node["amenity"="library"](around:${radius},${lat},${lng});
      way["amenity"="library"](around:${radius},${lat},${lng});
      
      // Sport & Wellness
      node["leisure"="swimming_pool"](around:${radius},${lat},${lng});
      way["leisure"="swimming_pool"](around:${radius},${lat},${lng});
      node["leisure"="fitness_centre"](around:${radius},${lat},${lng});
      way["leisure"="fitness_centre"](around:${radius},${lat},${lng});
      node["leisure"="sports_centre"](around:${radius},${lat},${lng});
      way["leisure"="sports_centre"](around:${radius},${lat},${lng});
      
      // Parks & Natur
      node["leisure"="park"](around:${radius},${lat},${lng});
      way["leisure"="park"](around:${radius},${lat},${lng});
      node["leisure"="playground"](around:${radius},${lat},${lng});
      way["leisure"="playground"](around:${radius},${lat},${lng});
      
      // Öffentlicher Verkehr
      node["highway"="bus_stop"](around:${radius},${lat},${lng});
      node["railway"="station"](around:${radius},${lat},${lng});
      node["railway"="tram_stop"](around:${radius},${lat},${lng});
      
      // Gastronomie
      node["amenity"="restaurant"](around:${radius},${lat},${lng});
      way["amenity"="restaurant"](around:${radius},${lat},${lng});
      node["amenity"="cafe"](around:${radius},${lat},${lng});
      way["amenity"="cafe"](around:${radius},${lat},${lng});
      node["amenity"="fast_food"](around:${radius},${lat},${lng});
      way["amenity"="fast_food"](around:${radius},${lat},${lng});
      
      // Einkaufen
      node["shop"="bakery"](around:${radius},${lat},${lng});
      way["shop"="bakery"](around:${radius},${lat},${lng});
      node["shop"="butcher"](around:${radius},${lat},${lng});
      way["shop"="butcher"](around:${radius},${lat},${lng});
      node["shop"="clothes"](around:${radius},${lat},${lng});
      way["shop"="clothes"](around:${radius},${lat},${lng});
      
      // Finanzdienstleistungen
      node["amenity"="bank"](around:${radius},${lat},${lng});
      way["amenity"="bank"](around:${radius},${lat},${lng});
      node["amenity"="atm"](around:${radius},${lat},${lng});
      
      // Sicherheit & Notfall
      node["amenity"="police"](around:${radius},${lat},${lng});
      way["amenity"="police"](around:${radius},${lat},${lng});
      node["amenity"="fire_station"](around:${radius},${lat},${lng});
      way["amenity"="fire_station"](around:${radius},${lat},${lng});
      
      // Dienstleistungen
      node["amenity"="post_office"](around:${radius},${lat},${lng});
      way["amenity"="post_office"](around:${radius},${lat},${lng});
      node["amenity"="fuel"](around:${radius},${lat},${lng});
      way["amenity"="fuel"](around:${radius},${lat},${lng});
      
      // Bildung (erweitert)
      node["amenity"="university"](around:${radius},${lat},${lng});
      way["amenity"="university"](around:${radius},${lat},${lng});
      node["amenity"="college"](around:${radius},${lat},${lng});
      way["amenity"="college"](around:${radius},${lat},${lng});
    );
    out geom;
  `

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    })

    const data = await response.json()
    
    // Count amenities by type and collect their details
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
      education: 0
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
      education: [] as Array<{lat: number, lng: number, name: string, type: string}>
    }

    data.elements?.forEach((element: any) => {
      const lat = element.lat || (element.center ? element.center.lat : null)
      const lng = element.lon || (element.center ? element.center.lon : null)
      const name = element.tags?.name || 'Unbekannt'
      
      if (!lat || !lng) return

      if (element.tags?.amenity === 'kindergarten') {
        amenityCounts.kindergarten++
        amenityDetails.kindergartens.push({ lat, lng, name })
      }
      if (element.tags?.amenity === 'school') {
        amenityCounts.school++
        amenityDetails.schools.push({ lat, lng, name })
      }
      if (element.tags?.shop === 'supermarket' || element.tags?.shop === 'convenience' || 
          element.tags?.shop === 'grocery' || element.tags?.shop === 'discount') {
        amenityCounts.supermarket++
        amenityDetails.supermarkets.push({ lat, lng, name })
      }
      if (element.tags?.amenity === 'doctors' || element.tags?.amenity === 'hospital') {
        if (element.tags?.amenity === 'doctors') amenityCounts.doctors++
        if (element.tags?.amenity === 'hospital') amenityCounts.hospital++
        amenityDetails.doctors.push({ lat, lng, name })
      }
      if (element.tags?.amenity === 'pharmacy') {
        amenityCounts.pharmacy++
        amenityDetails.pharmacies.push({ lat, lng, name })
      }
      
      // Culture & Entertainment
      if (element.tags?.amenity === 'cinema' || element.tags?.tourism === 'museum' || 
          element.tags?.amenity === 'theatre' || element.tags?.amenity === 'library') {
        amenityCounts.culture++
        const type = element.tags?.amenity || element.tags?.tourism || 'culture'
        amenityDetails.culture.push({ lat, lng, name, type })
      }
      
      // Sports & Wellness
      if (element.tags?.leisure === 'swimming_pool' || element.tags?.leisure === 'fitness_centre' || 
          element.tags?.leisure === 'sports_centre') {
        amenityCounts.sports++
        amenityDetails.sports.push({ lat, lng, name, type: element.tags.leisure })
      }
      
      // Parks & Nature
      if (element.tags?.leisure === 'park' || element.tags?.leisure === 'playground') {
        amenityCounts.parks++
        amenityDetails.parks.push({ lat, lng, name })
      }
      
      // Public Transport
      if (element.tags?.highway === 'bus_stop' || element.tags?.railway === 'station' || 
          element.tags?.railway === 'tram_stop') {
        amenityCounts.transport++
        const type = element.tags?.highway || element.tags?.railway || 'transport'
        amenityDetails.transport.push({ lat, lng, name, type })
      }
      
      // Restaurants & Food
      if (element.tags?.amenity === 'restaurant' || element.tags?.amenity === 'cafe' || 
          element.tags?.amenity === 'fast_food') {
        amenityCounts.restaurants++
        const type = element.tags?.amenity || 'restaurant'
        amenityDetails.restaurants.push({ lat, lng, name, type })
      }
      
      // Shopping
      if (element.tags?.shop === 'bakery' || element.tags?.shop === 'butcher' || 
          element.tags?.shop === 'clothes' || element.tags?.shop === 'convenience') {
        amenityCounts.shopping++
        const type = element.tags?.shop || 'shop'
        amenityDetails.shopping.push({ lat, lng, name, type })
      }
      
      // Financial Services
      if (element.tags?.amenity === 'bank' || element.tags?.amenity === 'atm') {
        amenityCounts.finance++
        const type = element.tags?.amenity || 'finance'
        amenityDetails.finance.push({ lat, lng, name, type })
      }
      
      // Safety & Emergency
      if (element.tags?.amenity === 'police' || element.tags?.amenity === 'fire_station') {
        amenityCounts.safety++
        const type = element.tags?.amenity || 'safety'
        amenityDetails.safety.push({ lat, lng, name, type })
      }
      
      // Services
      if (element.tags?.amenity === 'post_office' || element.tags?.amenity === 'fuel') {
        amenityCounts.services++
        const type = element.tags?.amenity || 'service'
        amenityDetails.services.push({ lat, lng, name, type })
      }
      
      // Education (expanded)
      if (element.tags?.amenity === 'university' || element.tags?.amenity === 'college') {
        amenityCounts.education++
        const type = element.tags?.amenity || 'education'
        amenityDetails.education.push({ lat, lng, name, type })
      }
    })

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
        education: []
      },
    }
  }
}
