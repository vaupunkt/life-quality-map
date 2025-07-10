import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  console.log('Received coordinates:', { lat, lng });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'LebensqualitaetsKarte/1.0',
        },
      }
    );

    const data = await response.json();

    if (!data || Object.keys(data).length === 0 || data.error) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const result = {
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      display_name: data.display_name,
      address: {
        city: data.address.city || data.address.town || data.address.village || '',
        road: data.address.road || '',
        house_number: data.address.house_number || '',
        postcode: data.address.postcode || '',
        country: data.address.country || '',
        country_code: data.address.country_code || '',
        state: data.address.state || '',
      },
      name: data.name || data.display_name 
    } as GeocodeResponse; 

    return NextResponse.json(result);
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ error: 'Error during geocoding' }, { status: 500 });
  }
}


export interface GeocodeResponse {
  lat: number;
  lng: number;
  display_name: string;
  address: {
    city?: string;
    road?: string;
    house_number?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
    state?: string;
  };
  name?: string;
}
