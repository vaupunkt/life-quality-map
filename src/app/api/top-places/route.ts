import { NextRequest, NextResponse } from 'next/server'
import { getTopPlaces } from '../../helper/getTopPlaces'

export async function GET(_req: NextRequest) {
  // Liefert die Top 10 Orte der letzten 30 Tage
  const places = getTopPlaces(10)
  return NextResponse.json(places)
}
