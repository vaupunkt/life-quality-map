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
  const rows = db.prepare(`
    SELECT lat, lng, display_name, name, score, created_at, scoring_properties
    FROM geocode_cache
    WHERE created_at >= datetime('now', '-30 days')
      AND score IS NOT NULL
    ORDER BY score DESC
  `).all()

  const bestPerCity: {[city: string]: TopPlace} = {}
  for (const row of rows as any[]) {
    let city = ''
    let bundesland = ''
    try {
      const props = JSON.parse(row.scoring_properties)

      city = props?.address?.city || props?.address?.town || props?.address?.village
      bundesland = props?.address?.state || ''
      if (!city && typeof props.address === 'string') {

        const parts = props.address.split(',').map((s: string) => s.trim())
        const bundeslandList = ['Bayern','Nordrhein-Westfalen','Baden-Württemberg','Berlin','Brandenburg','Bremen','Hamburg','Hessen','Mecklenburg-Vorpommern','Niedersachsen','Rheinland-Pfalz','Saarland','Sachsen','Sachsen-Anhalt','Schleswig-Holstein','Thüringen']
        const landkreisPattern = /^Landkreis /i
        for (let i = 0; i < parts.length; i++) {
          if (bundeslandList.includes(parts[i])) {
            if (i > 1 && landkreisPattern.test(parts[i-1])) {
        
              city = parts[i-2]
            } else if (i > 0) {
              city = parts[i-1]
            }
            bundesland = parts[i]
            break
          }
        }

        if (!city) {
          for (const part of parts) {
            if (!bundeslandList.includes(part) && !landkreisPattern.test(part)) {
              city = part
              break
            }
          }
        }
      }

      if (["Berlin", "Hamburg", "Bremen"].includes(bundesland)) {
        city = bundesland
      }
    } catch {}
    if (!city) continue
    if (!bestPerCity[city] || row.score > bestPerCity[city].score) {
      bestPerCity[city] = { ...row, city }
    }
  }
  return Object.values(bestPerCity)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
