# Klimadaten Integration - Klimastatusbericht 2024

## Übersicht

Die Lebensqualitäts-Karte integriert offizielle Klimadaten aus dem Klimastatusbericht 2024 für alle deutschen Bundesländer. Diese ersetzen die simulierten Lärm- und Verkehrsdaten und bieten reale Umweltfaktoren.

## Datenquelle

**Klimastatusbericht 2024** - Offizielle Klimadaten des Deutschen Wetterdienstes (DWD)

### Verfügbare Klimadaten

- **Jahresdurchschnittstemperatur** (°C)
- **Durchschnittlicher jährlicher Niederschlag** (mm)  
- **Mittlere jährliche Sonnenscheindauer** (Stunden)

### Datensatz (2024)

| Bundesland | Temperatur (°C) | Niederschlag (mm) | Sonnenschein (h) |
|------------|----------------|-------------------|------------------|
| Hamburg | 11,3 | 946,9 | 1643,0 |
| Bayern | 10,3 | 1070,4 | 1717,2 |
| Schleswig-Holstein | 10,8 | 961,7 | 1646,9 |
| Nordrhein-Westfalen | 11,3 | 1028,3 | 1499,7 |
| Rheinland-Pfalz | 10,9 | 930,6 | 1585,5 |
| Baden-Württemberg | 10,3 | 1068,9 | 1654,0 |
| Sachsen-Anhalt | 11,5 | 613,2 | 1758,4 |
| Niedersachsen | 11,3 | 920,7 | 1602,7 |
| Hessen | 10,7 | 888,9 | 1568,2 |
| Brandenburg | 11,5 | 601,9 | 1851,1 |
| Thüringen | 10,5 | 790,5 | 1670,3 |
| Sachsen | 10,9 | 711,2 | 1830,1 |
| Bremen | 11,4 | 938,5 | 1637,6 |
| Saarland | 11,1 | 1204,9 | 1588,5 |
| Berlin | 11,9 | 549,9 | 1914,5 |
| Mecklenburg-Vorpommern | 11,0 | 695,9 | 1762,1 |

## Bewertungsalgorithmus

### 1. Temperatur-Score (40% Gewichtung)

```typescript
// Ideal: 10-15°C
if (temperatur < 8) {
  score = max(0, 10 - abs(10 - temperatur) * 2)
} else if (temperatur > 15) {
  score = max(0, 10 - abs(temperatur - 12) * 1.5)
} else {
  score = 10 - abs(temperatur - 12) * 0.5
}
```

**Beispiele:**
- Berlin (11,9°C) → Score: 10/10 (optimal)
- Bayern (10,3°C) → Score: 9/10 (sehr gut)

### 2. Niederschlag-Score (30% Gewichtung)

```typescript
// Ideal: 700-900mm/Jahr
if (niederschlag < 600) {
  score = max(0, (niederschlag / 600) * 10)
} else if (niederschlag > 1000) {
  score = max(0, 10 - (niederschlag - 1000) / 100)
} else {
  score = max(0, 10 - abs(niederschlag - 800) / 50)
}
```

**Beispiele:**
- Brandenburg (601,9mm) → Score: 10/10 (wenig Regen)
- Saarland (1204,9mm) → Score: 8/10 (viel Regen)

### 3. Sonnenschein-Score (30% Gewichtung)

```typescript
// Mehr ist besser, Maximum bei 2000h
score = min(10, (sonnenschein / 2000) * 10)
```

**Beispiele:**
- Berlin (1914,5h) → Score: 10/10 (sehr sonnig)
- Nordrhein-Westfalen (1499,7h) → Score: 7/10 (weniger sonnig)

### 4. Gesamt-Klima-Score

```typescript
klimaScore = round(
  temperaturScore * 0.4 + 
  niederschlagScore * 0.3 + 
  sonnenscheinScore * 0.3
)
```

## UI-Integration

### Toggle-Steuerung

Die Klimadaten werden nur angezeigt, wenn der **Umweltdaten-Toggle** aktiviert ist. Dies ersetzt die zuvor angezeigten simulierten Lärm- und Verkehrsdaten.

### Anzeige-Komponenten

1. **Klima-Gesamtscore** - Prominente Anzeige mit Farbkodierung
2. **Einzelwerte** - Temperatur, Niederschlag, Sonnenschein mit individuellen Scores
3. **Bundesland-Zuordnung** - Automatische Erkennung via Koordinaten
4. **Fallback** - Meldung wenn keine Klimadaten verfügbar (z.B. Ausland)

### Farbkodierung

- **🟢 Grün (7-10):** Sehr gut
- **🟡 Gelb (4-6):** Durchschnittlich  
- **🔴 Rot (0-3):** Ungünstig

## Technische Umsetzung

### Datenstruktur

```json
{
  "bundesland": {
    "temperatur": 11.3,
    "niederschlag": 946.9,
    "sonnenschein": 1643.0
  }
}
```

### API-Integration

```typescript
// In calculateQualityScore()
const klimaScores = calculateClimaScore(bundeslandInfo.klimadaten)
const { temperaturScore, niederschlagScore, sonnenscheinScore, klimaScore } = klimaScores

// Rückgabe erweitert um:
return {
  // ...existing scores
  klimadaten: bundeslandInfo.klimadaten,
  klimaScore: klimaScore,
  temperatur: temperaturScore,
  niederschlag: niederschlagScore,
  sonnenschein: sonnenscheinScore
}
```

### Frontend-Anzeige

```tsx
{showEnviromentData && qualityScore.klimadaten && (
  <div className="klimadaten-anzeige">
    <h3>🌤️ Klimadaten ({qualityScore.bundesland})</h3>
    <div className="klima-scores">
      <div>🌍 Klima-Score: {qualityScore.klimaScore}/10</div>
      <div>🌡️ {qualityScore.klimadaten.temperatur}°C (Score: {qualityScore.temperatur}/10)</div>
      <div>🌧️ {qualityScore.klimadaten.niederschlag}mm (Score: {qualityScore.niederschlag}/10)</div>
      <div>☀️ {qualityScore.klimadaten.sonnenschein}h (Score: {qualityScore.sonnenschein}/10)</div>
    </div>
  </div>
)}
```

## Fallback-Strategien

1. **Kein Bundesland erkannt:** Keine Klimadaten-Anzeige
2. **Ausländische Koordinaten:** Fallback-Meldung
3. **API-Fehler:** Standardwerte (alle Scores = 5)

## Beste und Schlechteste Werte

### 🏆 Beste Klimawerte
- **Sonnenschein:** Berlin (1914,5h) - fast maximaler Score
- **Niederschlag:** Brandenburg (601,9mm) - wenig Regen
- **Temperatur:** Mehrere Bundesländer im Idealbereich

### 📉 Herausfordernde Klimawerte  
- **Niederschlag:** Saarland (1204,9mm) - sehr regenreich
- **Sonnenschein:** Nordrhein-Westfalen (1499,7h) - weniger sonnig
- **Temperatur:** Alle Werte im akzeptablen Bereich

## Aktualisierung

Die Klimadaten sollten jährlich mit dem neuen Klimastatusbericht aktualisiert werden:

1. Neue Daten aus dem DWD Klimastatusbericht abrufen
2. `src/data/klimadaten.json` aktualisieren  
3. Dokumentation entsprechend anpassen
4. Bewertungsalgorithmus bei Bedarf justieren

## Quellen

- **Deutscher Wetterdienst (DWD)**: Klimastatusbericht 2024
- **Bundesministerium für Umwelt**: Klimadaten Deutschland
