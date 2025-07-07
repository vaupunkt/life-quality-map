import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Adresse ist erforderlich' }, { status: 400 })
  }

  try {
    // Using Nominatim API for geocoding (free and open source)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'LebensqualitaetsKarte/1.0',
        },
      }
    )

    const data = await response.json()

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Adresse nicht gefunden' }, { status: 404 })
    }

    const result = data[0]
    return NextResponse.json({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name,
    })
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json({ error: 'Fehler beim Geocoding' }, { status: 500 })
  }
}
