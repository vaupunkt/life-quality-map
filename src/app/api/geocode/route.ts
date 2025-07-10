import { NextRequest, NextResponse } from 'next/server'


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const address = searchParams.get('address');

  if (address && !lat && !lng) {
    // If only address is provided, we can still proceed with geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${address}`,
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
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        display_name: data[0].display_name,
        name: data[0].name || data[0].display_name
      } as GeocodeResponse;
       return NextResponse.json(result);
    } catch (error) {
      console.error('Geocoding error:', error);
      return NextResponse.json({ error: 'Error during geocoding' }, { status: 500 });
    }
  } else if (!address && lat && lng) {
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
    } catch (error) {
      console.error('Geocoding error:', error);
      return NextResponse.json({ error: 'Error during geocoding' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  }
}


export interface GeocodeResponse {
  lat: number;
  lng: number;
  display_name: string;
  address?: {
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
