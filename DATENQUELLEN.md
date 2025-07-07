# 📊 Echte Datenquellen für Luftqualität und Verkehrsbelastung

## 🌬️ **Luftqualitätsdaten**

### 1. **OpenWeatherMap Air Pollution API** (Empfohlen)
- **Kostenlos**: 1000 Anfragen/Tag
- **Kostenpflichtig**: Ab $1.5/1000 Anfragen
- **Daten**: AQI, CO, NO₂, O₃, PM2.5, PM10
- **URL**: https://openweathermap.org/api/air-pollution
- **Setup**:
  ```bash
  # In .env.local
  OPENWEATHER_API_KEY=your_api_key_here
  ```

### 2. **World Air Quality Index API**
- **Kostenlos**: Begrenzte Anfragen
- **Daten**: Globaler AQI, verschiedene Schadstoffe
- **URL**: https://waqi.info/api/
- **Setup**:
  ```bash
  # In .env.local
  WAQI_API_TOKEN=your_token_here
  ```

### 3. **IQAir AirVisual API**
- **Kostenlos**: 10,000 Anfragen/Monat
- **Sehr genau**: Echtzeit-Luftqualitätsmessungen
- **URL**: https://www.iqair.com/air-pollution-data-api
- **Setup**:
  ```bash
  # In .env.local
  IQAIR_API_KEY=your_api_key_here
  ```

### 4. **EU Umweltbehörde (EEA)**
- **Kostenlos**: EU-weite Luftqualitätsdaten
- **URL**: https://discomap.eea.europa.eu/map/fme/AirQualityExport.htm
- **Format**: Download als CSV/JSON

## 🚗 **Verkehrsdaten**

### 1. **Google Maps Traffic API**
- **Kostenpflichtig**: $0.005-$0.01 pro Anfrage
- **Sehr genau**: Echtzeit-Verkehrsdaten
- **URL**: https://developers.google.com/maps/documentation/roads
- **Setup**:
  ```bash
  # In .env.local
  GOOGLE_MAPS_API_KEY=your_api_key_here
  ```

### 2. **HERE Traffic API**
- **Freemium**: 1000 Anfragen/Monat kostenlos
- **Daten**: Verkehrsfluss, Staus, Geschwindigkeiten
- **URL**: https://developer.here.com/documentation/traffic-api
- **Setup**:
  ```bash
  # In .env.local
  HERE_API_KEY=your_api_key_here
  ```

### 3. **TomTom Traffic API**
- **Freemium**: 2500 Anfragen/Tag kostenlos
- **Daten**: Live-Verkehrsinfo, Reisezeiten
- **URL**: https://developer.tomtom.com/traffic-api
- **Setup**:
  ```bash
  # In .env.local
  TOMTOM_API_KEY=your_api_key_here
  ```

### 4. **OpenStreetMap Overpass** (Kostenlos)
- **Straßentypen**: highway=primary, secondary, residential
- **Verkehrsdichte**: Ableitung aus Straßenklassifizierung
- **URL**: https://overpass-turbo.eu/
- **Bereits implementiert** ✅

## 🔊 **Lärmdaten**

### 1. **Strategische Lärmkarten** (Deutschland)
- **Kostenlos**: Offizielle EU-Lärmkarten
- **URL**: https://www.umweltbundesamt.de/themen/verkehr-laerm/laermkartierung
- **Format**: WMS/WFS Services

### 2. **OpenNoise Project**
- **Community**: Crowdsourced Lärmmessungen
- **URL**: https://opennoise.org/
- **API**: Noch in Entwicklung

### 3. **Kommunale Lärmkarten**
- **Stadt-spezifisch**: Viele deutsche Städte bieten eigene APIs
- **Beispiele**:
  - Berlin: https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/lka_strlae_
  - München: https://geoportal.muenchen.de/
  - Hamburg: https://geodienste.hamburg.de/

## 🛠️ **Implementierung**

### Umgebungsvariablen einrichten:
```bash
# .env.local erstellen
OPENWEATHER_API_KEY=your_key
WAQI_API_TOKEN=your_token
GOOGLE_MAPS_API_KEY=your_key
HERE_API_KEY=your_key
TOMTOM_API_KEY=your_key
```

### API-Integration aktivieren:
1. In `/src/app/api/air-quality/route.ts` die gewünschte API uncommentieren
2. API-Keys in `.env.local` hinzufügen
3. Rate Limits beachten
4. Error Handling implementieren

## 💡 **Empfohlene Kombination:**
- **Luftqualität**: OpenWeatherMap (zuverlässig + günstig)
- **Verkehr**: HERE API (gutes Preis-Leistungs-Verhältnis)
- **Lärm**: Strategische Lärmkarten (kostenlos + offiziell)

## 🎯 **Kostenoptimierung:**
- **Caching**: Daten für 15-30 Minuten zwischenspeichern
- **Batch-Requests**: Mehrere Punkte gleichzeitig abfragen
- **Fallback**: Kombiniere echte Daten mit simulierten Werten
