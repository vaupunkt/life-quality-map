import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Koordinaten sind erforderlich' }, { status: 400 })
  }

  try {
    // Option 1: OpenWeatherMap Air Pollution API (kostenlos mit API Key)
    // const API_KEY = process.env.OPENWEATHER_API_KEY
    // if (API_KEY) {
    //   const response = await fetch(
    //     `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${API_KEY}`
    //   )
    //   const data = await response.json()
    //   
    //   if (data.list && data.list[0]) {
    //     const aqi = data.list[0].main.aqi // 1-5 scale
    //     const components = data.list[0].components
    //     
    //     return NextResponse.json({
    //       airQuality: {
    //         aqi: aqi,
    //         description: getAQIDescription(aqi),
    //         components: {
    //           co: components.co,
    //           no2: components.no2,
    //           o3: components.o3,
    //           pm2_5: components.pm2_5,
    //           pm10: components.pm10
    //         }
    //       }
    //     })
    //   }
    // }

    // Option 2: World Air Quality Index API (kostenlos)
    // const WAQI_TOKEN = process.env.WAQI_API_TOKEN
    // if (WAQI_TOKEN) {
    //   const response = await fetch(
    //     `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${WAQI_TOKEN}`
    //   )
    //   const data = await response.json()
    //   
    //   if (data.status === 'ok') {
    //     return NextResponse.json({
    //       airQuality: {
    //         aqi: data.data.aqi,
    //         description: getAQIDescription(Math.round(data.data.aqi / 20)), // Convert to 1-5 scale
    //         city: data.data.city.name,
    //         pollutants: data.data.iaqi
    //       }
    //     })
    //   }
    // }

    // Fallback: Simulierte Daten basierend auf Stadtdichte
    const mockAirQuality = generateMockAirQuality(parseFloat(lat), parseFloat(lng))
    
    return NextResponse.json({
      airQuality: mockAirQuality,
      note: 'Simulierte Daten - für echte Daten API-Schlüssel konfigurieren'
    })
    
  } catch (error) {
    console.error('Air quality API error:', error)
    
    // Fallback data
    return NextResponse.json({
      airQuality: {
        aqi: 3,
        description: 'Mäßig',
        note: 'Fallback-Daten aufgrund von API-Fehler'
      }
    })
  }
}

function generateMockAirQuality(lat: number, lng: number) {
  // Simulate air quality based on location (cities tend to have worse air quality)
  // This is a very simplified simulation
  
  // Known city centers (rough coordinates)
  const cityCenters = [
    { lat: 52.5200, lng: 13.4050, name: 'Berlin' },
    { lat: 48.1351, lng: 11.5820, name: 'München' },
    { lat: 53.5511, lng: 9.9937, name: 'Hamburg' },
    { lat: 50.1109, lng: 8.6821, name: 'Frankfurt' },
    { lat: 51.2277, lng: 6.7735, name: 'Düsseldorf' }
  ]
  
  let minDistance = Infinity
  let nearestCity = null
  
  for (const city of cityCenters) {
    const distance = Math.sqrt(
      Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
    )
    if (distance < minDistance) {
      minDistance = distance
      nearestCity = city
    }
  }
  
  // Distance-based air quality (closer to city center = worse air quality)
  let aqi
  if (minDistance < 0.05) { // Very close to city center
    aqi = Math.floor(Math.random() * 2) + 3 // 3-4 (mäßig bis schlecht)
  } else if (minDistance < 0.1) { // Near city
    aqi = Math.floor(Math.random() * 2) + 2 // 2-3 (gut bis mäßig)
  } else { // Rural/suburban
    aqi = Math.floor(Math.random() * 2) + 1 // 1-2 (gut bis mäßig)
  }
  
  return {
    aqi: aqi,
    description: getAQIDescription(aqi),
    nearestCity: nearestCity?.name,
    distanceToCity: Math.round(minDistance * 111) // Convert to km
  }
}

function getAQIDescription(aqi: number): string {
  switch (aqi) {
    case 1: return 'Sehr gut'
    case 2: return 'Gut'
    case 3: return 'Mäßig'
    case 4: return 'Schlecht'
    case 5: return 'Sehr schlecht'
    default: return 'Unbekannt'
  }
}
