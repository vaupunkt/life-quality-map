# SKL Glücksatlas Integration

## Übersicht

Die Lebensqualitäts-Karte integriert Daten aus dem SKL Glücksatlas, einer wissenschaftlichen Studie zur Lebenszufriedenheit in Deutschland nach Bundesländern.

## Datenquelle

**SKL Glücksatlas** - Eine jährliche Studie, die die subjektive Lebenszufriedenheit der Deutschen auf einer Skala von 0-10 misst.

### Aktuelle Werte (2024)

| Bundesland | Lebenszufriedenheit |
|------------|-------------------|
| Hamburg | 7,38 |
| Bayern | 7,23 |
| Schleswig-Holstein | 7,23 |
| Nordrhein-Westfalen | 7,17 |
| Rheinland-Pfalz | 7,11 |
| Baden-Württemberg | 7,10 |
| Sachsen-Anhalt | 7,08 |
| Niedersachsen | 7,02 |
| Hessen | 7,01 |
| Brandenburg | 6,99 |
| Thüringen | 6,90 |
| Sachsen | 6,87 |
| Bremen | 6,76 |
| Saarland | 6,73 |
| Berlin | 6,63 |
| Mecklenburg-Vorpommern | 6,17 |

## Technische Integration

### API-Integration

1. **Koordinaten → Bundesland**: Verwendung der Nominatim Reverse Geocoding API
2. **Bundesland → Lebenszufriedenheit**: Lookup in `src/data/lebenszufriedenheit.json`
3. **Score-Berechnung**: 10% Gewichtung in der Gesamtbewertung

### Implementierung

```typescript
// API Route: src/app/api/quality-score/route.ts
async function getBundeslandFromCoordinates(lat: number, lng: number) {
  // 1. Reverse Geocoding mit Nominatim
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=5&addressdetails=1`)
  
  // 2. Bundesland extrahieren
  const data = await response.json()
  const state = data.address?.state
  
  // 3. Lebenszufriedenheit laden
  const lebenszufriedenheitData = JSON.parse(fs.readFileSync('src/data/lebenszufriedenheit.json', 'utf8'))
  const lebenszufriedenheit = lebenszufriedenheitData[state]
  
  return { bundesland: state, lebenszufriedenheit }
}
```

### Score-Berechnung

```typescript
// Lebenszufriedenheit in Gesamtbewertung einbeziehen (10% Gewichtung)
if (bundeslandInfo.lebenszufriedenheit) {
  const lifeSatisfactionScore = Math.round((bundeslandInfo.lebenszufriedenheit / 10) * 10)
  overallScore += lifeSatisfactionScore * 0.1 * totalWeight
  totalWeight += 0.1 * totalWeight
}
```

## Frontend-Anzeige

### Bundesland-Badge

Die Anwendung zeigt das erkannte Bundesland und die zugehörige Lebenszufriedenheit in einem eigenen Badge an:

```tsx
{qualityScore.bundesland && (
  <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
    <div className="text-sm font-medium text-gray-700">
      📍 {qualityScore.bundesland}
    </div>
    {qualityScore.lebenszufriedenheit && (
      <div className="text-xs mt-1 text-gray-600">
        Lebenszufriedenheit: <span className="font-semibold text-blue-500">
          {qualityScore.lebenszufriedenheit.toFixed(1)}/10
        </span>
        <span className="ml-1 text-xs text-gray-500">
          (SKL Glücksatlas)
        </span>
      </div>
    )}
  </div>
)}
```

## Fallback-Strategien

1. **Nominatim API-Fehler**: Bundesland bleibt `null`, Bewertung ohne Lebenszufriedenheit
2. **Unbekanntes Bundesland**: Alternative Schreibweisen werden geprüft (z.B. "Bavaria" → "Bayern")
3. **Ausland**: Keine Lebenszufriedenheitsdaten verfügbar

## Aktualisierung der Daten

Die Lebenszufriedenheitsdaten sollten jährlich aktualisiert werden, wenn neue SKL Glücksatlas-Daten veröffentlicht werden:

1. Neue Daten aus dem SKL Glücksatlas abrufen
2. `src/data/lebenszufriedenheit.json` aktualisieren
3. Diese Dokumentation entsprechend anpassen

## Quellen

- **SKL Glücksatlas**: https://www.skl-gluecksatlas.de/
- **Nominatim API**: https://nominatim.openstreetmap.org/
