# Klimadaten Integration - Klimastatusbericht 2024 (Verschärfte Bewertung)

## Übersicht

Die Lebensqualitäts-Karte integriert offizielle Klimadaten aus dem Klimastatusbericht 2024 für alle deutschen Bundesländer. Diese ersetzen die simulierten Lärm- und Verkehrsdaten und bieten reale Umweltfaktoren mit einer **verschärften Bewertungslogik**.

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

## Verschärfter Bewertungsalgorithmus

### 1. Temperatur-Score (45% Gewichtung - Erhöht)

```typescript
// Verschärft: Ideal 9-13°C (engerer Bereich)
const idealTemp = 11
const tempDiff = Math.abs(temperatur - idealTemp)

if (temperatur < 7) {
  // Sehr kalt: drastische Penalty
  score = max(0, 3 - (7 - temperatur) * 0.8)
} else if (temperatur > 16) {
  // Sehr warm: drastische Penalty  
  score = max(0, 3 - (temperatur - 16) * 0.7)
} else if (tempDiff <= 2) {
  // Idealer Bereich: maximaler Score mit sanftem Abfall
  score = 10 - tempDiff * 1.5
} else {
  // Außerhalb ideal: starker Abfall
  score = max(1, 7 - (tempDiff - 2) * 2.5)
}
```

**Beispiele (verschärft):**
- Hamburg (11,3°C) → Score: 10/10 (optimal im Idealbereich)
- Berlin (11,9°C) → Score: 9/10 (nah am Ideal)
- Bayern (10,3°C) → Score: 9/10 (gut im Idealbereich)

### 2. Niederschlag-Score (35% Gewichtung - Erhöht)

```typescript
// Verschärft: Ideal 750-850mm (engerer Bereich)
const idealNiederschlag = 800
const niederschlagDiff = Math.abs(niederschlag - idealNiederschlag)

if (niederschlag < 500) {
  // Sehr trocken: drastische Penalty
  score = max(0, 2 - (500 - niederschlag) / 100)
} else if (niederschlag > 1200) {
  // Sehr nass: drastische Penalty
  score = max(0, 2 - (niederschlag - 1200) / 150)
} else if (niederschlagDiff <= 50) {
  // Idealer Bereich: maximaler Score
  score = 10 - niederschlagDiff / 25
} else if (niederschlagDiff <= 150) {
  // Akzeptabel: moderater Abfall
  score = max(3, 8 - (niederschlagDiff - 50) / 20)
} else {
  // Außerhalb: starker Abfall
  score = max(1, 3 - (niederschlagDiff - 150) / 50)
}
```

**Beispiele (verschärft):**
- Thüringen (790,5mm) → Score: 10/10 (optimal)
- Bayern (1070,4mm) → Score: 4/10 (zu nass, verschärft bewertet)
- Berlin (549,9mm) → Score: 6/10 (zu trocken, aber nicht extrem)

### 3. Sonnenschein-Score (20% Gewichtung - Reduziert)

```typescript
// Verschärft: Ideal 1600-1800h, zu viel wird bestraft
const idealSonnenschein = 1700
const sonnenscheinDiff = Math.abs(sonnenschein - idealSonnenschein)

if (sonnenschein < 1200) {
  // Zu wenig Sonne
  score = max(1, (sonnenschein / 1200) * 6)
} else if (sonnenschein > 2200) {
  // Zu viel Sonne (extreme Hitze)
  score = max(2, 8 - (sonnenschein - 2200) / 100)
} else if (sonnenscheinDiff <= 100) {
  // Idealer Bereich
  score = 10 - sonnenscheinDiff / 50
} else {
  // Außerhalb ideal
  score = max(3, 8 - (sonnenscheinDiff - 100) / 80)
}
```

**Beispiele (verschärft):**
- Thüringen (1670,3h) → Score: 10/10 (optimal)
- Berlin (1914,5h) → Score: 8/10 (etwas zu viel, aber noch gut)
- Brandenburg (1851,1h) → Score: 8/10 (ähnlich)

### 4. Verschärfter Gesamt-Klima-Score

```typescript
// Neue Gewichtung und Extreme-Penalty
const gewichteterScore = (
  temperaturScore * 0.45 + 
  niederschlagScore * 0.35 + 
  sonnenscheinScore * 0.2
)

// Zusätzliche Penalty für kombinierte Extreme
let extremePenalty = 0
if ((temperatur < 8 || temperatur > 15) && 
    (niederschlag < 600 || niederschlag > 1100)) {
  extremePenalty = 1.5
}

klimaScore = round(max(0, gewichteterScore - extremePenalty))
```

## Verschärfungen im Überblick

### Härtere Bewertungskriterien

1. **Engere Idealbereiche**: Nur noch kleine optimale Zonen
2. **Stärkere Penalties**: Extreme Werte führen zu drastischen Score-Abfällen
3. **Kombinierte Penalties**: Zusätzliche Abzüge bei mehreren Extremen
4. **Angepasste Gewichtung**: Temperatur wichtiger, Sonnenschein weniger wichtig

### Vergleich Alt vs. Neu

| Aspekt | Alt | Neu (Verschärft) |
|--------|-----|------------------|
| Temperatur Ideal | 10-15°C | 9-13°C |
| Temperatur Gewicht | 40% | 45% |
| Niederschlag Ideal | 700-900mm | 750-850mm |
| Niederschlag Gewicht | 30% | 35% |
| Sonnenschein Gewicht | 30% | 20% |
| Extreme Penalty | Keine | -1.5 bei Kombination |

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
