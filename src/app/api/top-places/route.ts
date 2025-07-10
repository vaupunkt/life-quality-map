import { NextRequest, NextResponse } from 'next/server'
import { getTopPlaces } from '../../helper/getTopPlaces'

export async function GET(_req: NextRequest) {
  const places = getTopPlaces(10)
  return NextResponse.json(places)
}
