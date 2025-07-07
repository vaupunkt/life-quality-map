# Copilot Instructions für Lebensqualitäts-Karte

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Projekt-Übersicht

Dieses Projekt ist eine Next.js-Anwendung zur Bewertung der Lebensqualität basierend auf Adressen. Die Anwendung nutzt:

- **Next.js 15** mit App Router
- **TypeScript** für Typsicherheit
- **Tailwind CSS** für Styling
- **Leaflet** für interaktive Karten
- **OpenStreetMap** für Kartendaten
- **Overpass API** für Daten über nahegelegene Einrichtungen

## Funktionalitäten

- Adresseingabe und Geocoding
- Interaktive Karte mit Leaflet
- Berechnung von Lebensqualitäts-Scores basierend auf:
  - Kindergärten in der Nähe
  - Schulen in der Nähe
  - Supermärkte in der Nähe
  - Ärzte/Apotheken in der Nähe
  - Lärmbelastung (simuliert)
  - Verkehrsbelastung (simuliert)

## API-Struktur

- `/api/geocode` - Konvertiert Adressen in Koordinaten
- `/api/quality-score` - Berechnet Lebensqualitäts-Scores

## Wichtige Hinweise

- Die Anwendung verwendet deutsche Sprache
- Alle Koordinaten sind in WGS84 (lat/lng)
- Die Kartenkomponente ist dynamisch geladen, um SSR-Probleme zu vermeiden
- Fallback-Daten werden bereitgestellt, falls externe APIs nicht verfügbar sind

## Coding-Stil

- Verwende TypeScript für alle neuen Dateien
- Nutze Tailwind CSS für Styling
- Implementiere responsive Design
- Halte API-Routen schlank und gut strukturiert
- Verwende deutsche Kommentare und Variablennamen wo angemessen
