# Lebensqualitäts-Karte

Eine interaktive Next.js-Anwendung zur Bewertung der Lebensqualität basierend auf Adressen.

## Funktionen

- **Adresseingabe**: Geben Sie eine beliebige Adresse ein
- **Interaktive Karte**: Visualisierung mit OpenStreetMap und Leaflet
- **Lebensqualitäts-Score**: Bewertung basierend auf:
  - Kindergärten in der Nähe
  - Schulen in der Nähe
  - Supermärkte in der Nähe
  - Ärzte und Apotheken in der Nähe
  - Lärmbelastung (simuliert)
  - Verkehrsbelastung (simuliert)

## Technologien

- **Next.js 15** mit App Router
- **TypeScript** für Typsicherheit
- **Tailwind CSS** für modernes Styling
- **Leaflet** für interaktive Karten
- **OpenStreetMap** für Kartendaten
- **Overpass API** für Daten über nahegelegene Einrichtungen
- **Nominatim API** für Geocoding
- 

## Installation

```bash
npm install
```

## Entwicklung

```bash
npm run dev
```

Öffnen Sie [http://localhost:3000](http://localhost:3000) in Ihrem Browser.

## Verwendung

1. Geben Sie eine Adresse in das Eingabefeld ein
2. Klicken Sie auf "Bewerten"
3. Die Anwendung zeigt:
   - Einen Gesamtscore für die Lebensqualität
   - Einzelbewertungen für verschiedene Kategorien
   - Die Position auf der interaktiven Karte

## API-Endpoints

- `GET /api/geocode?address=<adresse>` - Konvertiert Adressen in Koordinaten
- `POST /api/quality-score` - Berechnet Lebensqualitäts-Scores

## Projekt-Struktur

```
src/
├── app/
│   ├── api/
│   │   ├── geocode/
│   │   └── quality-score/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
└── components/
    └── Map.tsx
```

## Lizenz

MIT
