import { getDb } from '../api/geocode/db'

export interface TopPlace {
  lat: number
  lng: number
  display_name: string
  name: string
  score: number
  created_at: string
  city: string
  scoring_properties: string
}

export function getTopPlaces(limit = 10): TopPlace[] {
  const db = getDb()
  // Hole alle Einträge der letzten 30 Tage mit Score und city, sortiert nach Score absteigend
  const rows = db.prepare(`
    SELECT lat, lng, display_name, name, score, created_at, scoring_properties
    FROM geocode_cache
    WHERE created_at >= datetime('now', '-30 days')
      AND score IS NOT NULL
    ORDER BY score DESC
  `).all()

  // Dopplungen vermeiden: Nur jeweils die beste Bewertung pro Stadt (city, town, village, fallback auf address-Parsing)
  const bestPerCity: {[city: string]: TopPlace} = {}
  for (const row of rows) {
    let city = ''
    let bundesland = ''
    try {
      const props = JSON.parse(row.scoring_properties)
      // Versuche city, sonst town, sonst village, sonst address-Parsing
      city = props?.address?.city || props?.address?.town || props?.address?.village
      bundesland = props?.address?.state || ''
      if (!city && typeof props.address === 'string') {
        // Fallback: Stadtname aus address-String extrahieren (z.B. "..., München, Bayern, ...")
        const parts = props.address.split(',').map((s: string) => s.trim())
        // Suche nach erstem Teil, der wie eine Stadt aussieht (z.B. vor Bundesland)
        const bundeslandList = ['Bayern','Nordrhein-Westfalen','Baden-Württemberg','Berlin','Brandenburg','Bremen','Hamburg','Hessen','Mecklenburg-Vorpommern','Niedersachsen','Rheinland-Pfalz','Saarland','Sachsen','Sachsen-Anhalt','Schleswig-Holstein','Thüringen']
        for (let i = 0; i < parts.length; i++) {
          if (bundeslandList.includes(parts[i])) {
            if (i > 0) city = parts[i-1]
            bundesland = parts[i]
            break
          }
        }
      }
      // Sonderfall Stadtstaaten: Wenn Bundesland Berlin, Hamburg oder Bremen, dann Stadtname = Bundesland
      if (["Berlin", "Hamburg", "Bremen"].includes(bundesland)) {
        city = bundesland
      }
    } catch {}
    if (!city) continue
    if (!bestPerCity[city] || row.score > bestPerCity[city].score) {
      bestPerCity[city] = { ...row, city }
    }
  }
  // Top N Städte nach Score
  return Object.values(bestPerCity)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
