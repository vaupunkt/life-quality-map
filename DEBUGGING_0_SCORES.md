# Warum zeigen alle Kategorien 0/10 Bewertungen?

## Mögliche Ursachen für 0/10 Bewertungen

### 1. **Overpass API Probleme**
- **Server-Überlastung**: Die Overpass API kann bei hoher Last langsam reagieren oder temporär nicht verfügbar sein
- **Rate Limiting**: Zu viele Anfragen in kurzer Zeit können zu Blockierungen führen
- **Zeitüberschreitung**: Komplexe Abfragen können zu lange dauern und abbrechen

### 2. **Unvollständige OpenStreetMap-Daten**
- **Ländliche Gebiete**: Weniger dicht besiedelte Regionen haben oft unvollständige OSM-Daten
- **Fehlende Tagging**: Einrichtungen existieren physisch, sind aber nicht korrekt in OSM eingetragen
- **Veraltete Daten**: Einige Regionen werden seltener aktualisiert

### 3. **Suchradius zu klein**
- **500m Fußweg**: In ländlichen Gebieten können Einrichtungen weiter entfernt sein
- **Falsche Koordinaten**: Geocoding kann manchmal ungenau sein

### 4. **Technische Probleme**
- **Netzwerk-Timeouts**: Langsame Internetverbindung oder Serverprobleme
- **CORS-Probleme**: Browser-Sicherheitsrichtlinien können API-Aufrufe blockieren
- **Parsing-Fehler**: Defekte OSM-Daten können die Verarbeitung stören

## So erkennen Sie die Ursache

### 1. **Browser-Entwicklertools öffnen**
```
F12 → Console Tab
```
Schauen Sie nach Fehlermeldungen wie:
- "Overpass API error: 504" (Server-Timeout)
- "Overpass API error: 429" (Rate Limiting)
- "Network Error" (Verbindungsprobleme)

### 2. **Andere Standorte testen**
Versuchen Sie bekannte, dicht besiedelte Gebiete:
- **Berlin Alexanderplatz**
- **München Marienplatz** 
- **Hamburg Hauptbahnhof**

### 3. **Suchradius erhöhen**
- Wechseln Sie von "Zu Fuß (500m)" auf "Fahrrad (1.5km)" oder "Auto (3km)"

### 4. **Netzwerk-Tab prüfen**
```
F12 → Network Tab → Filter: XHR
```
Schauen Sie nach der `/api/quality-score` Anfrage:
- **Status 200**: API funktioniert, aber keine Daten gefunden
- **Status 500/502/504**: Server-Probleme
- **Lange Ladezeit**: Overpass API überlastet

## Bewertungsalgorithmus

### Wie werden die Scores berechnet?

```javascript
// Beispiel für Supermärkte
const supermarketScore = Math.min(10, Math.round(amenityCounts.supermarket * 1.5))

// Formel: Score = min(10, Anzahl_gefundener_Einrichtungen × Multiplikator)
```

### Score-Multiplikatoren pro Kategorie:
- **Kindergärten**: `Anzahl × 2` (max. 10)
- **Schulen**: `Anzahl × 2` (max. 10)  
- **Supermärkte**: `Anzahl × 1.5` (max. 10)
- **Ärzte**: `(Ärzte + Krankenhäuser) × 1.5` (max. 10)
- **Apotheken**: `Anzahl × 2` (max. 10)
- **Kultur**: `Anzahl × 1.5` (max. 10)
- **Sport**: `Anzahl × 1.5` (max. 10)
- **Parks**: `Anzahl × 1.5` (max. 10)
- **ÖPNV**: `Anzahl × 0.5` (max. 10)
- **Restaurants**: `Anzahl × 1.0` (max. 10)
- **Shopping**: `Anzahl × 1.0` (max. 10)
- **Banken**: `Anzahl × 1.5` (max. 10)
- **Sicherheit**: `Anzahl × 2` (max. 10)
- **Services**: `Anzahl × 1.5` (max. 10)
- **Friseure**: `Anzahl × 2` (max. 10)
- **Hochschulen**: `Anzahl × 1.5` (max. 10)

### Warum unterschiedliche Multiplikatoren?

- **Hohe Multiplikatoren (×2)**: Kritische Services wie Kindergärten, Schulen, Apotheken, Sicherheit, Friseure
- **Mittlere Multiplikatoren (×1.5)**: Wichtige aber nicht kritische Services
- **Niedrige Multiplikatoren (×1.0)**: Häufige Services wie Restaurants
- **Sehr niedrige Multiplikatoren (×0.5)**: ÖPNV (da Haltestellen sehr häufig sind)

## Lösungsansätze

### 1. **Fallback-Daten aktivieren**
Bei API-Fehlern werden Mock-Daten verwendet, um die Funktionalität zu demonstrieren.

### 2. **Alternative APIs**
- **Nominatim für POI-Suche**: Ergänzung zu Overpass
- **Local Search APIs**: Google Places, Here Maps (kostenpflichtig)

### 3. **Caching implementieren**
- Häufig abgefragte Standorte zwischenspeichern
- Redis oder lokale Datenbank für bessere Performance

### 4. **Erweiterte OSM-Abfragen**
```javascript
// Aktuell verwendete Overpass-Abfrage (vereinfacht)
nwr["shop"="supermarket"](around:500,52.520008,13.404954);

// Erweiterte Abfrage mit mehr Varianten
nwr["shop"~"^(supermarket|convenience|grocery|discount)$"](around:500,52.520008,13.404954);
```

## Debugging-Tipps

### 1. **API direkt testen**
```bash
curl -X POST "https://overpass-api.de/api/interpreter" \
  -d "data=[out:json];nwr[\"shop\"=\"supermarket\"](around:500,52.520008,13.404954);out center;"
```

### 2. **Overpass Turbo verwenden**
[overpass-turbo.eu](https://overpass-turbo.eu/) - Visueller Query-Builder für OSM-Daten

### 3. **Koordinaten prüfen**
Verwenden Sie [latlong.net](https://www.latlong.net/) um sicherzustellen, dass die Koordinaten korrekt sind.

---

**Hinweis**: Diese App nutzt kostenlose, öffentliche APIs. In einer Produktionsumgebung würden kommerzielle APIs mit SLA (Service Level Agreement) bessere Zuverlässigkeit bieten.
