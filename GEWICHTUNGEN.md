# Gewichtungen in der Lebensqualitäts-Karte

Diese Dokumentation erklärt das Gewichtungssystem der Lebensqualitäts-Karte und wie die verschiedenen Faktoren in die Gesamtbewertung einfließen.

## Übersicht des Bewertungssystems

Die Lebensqualitäts-Karte verwendet ein zweistufiges Gewichtungssystem:
1. **Gruppengewichtung**: Bestimmt die Wichtigkeit einer gesamten Kategorie-Gruppe
2. **Kategoriengewichtung**: Bestimmt die Wichtigkeit einzelner Kategorien innerhalb einer Gruppe

### Finale Gewichtung
Die finale Gewichtung errechnet sich durch: `Gruppengewichtung × Kategoriengewichtung`

## Gewichtungsstufen

| Gewichtung | Label | Beschreibung |
|------------|-------|--------------|
| 1.2 | **Sehr wichtig** | Kritische Faktoren für die Lebensqualität |
| 1.1 | **Wichtig** | Relevante Faktoren mit erhöhter Bedeutung |
| 1.0 | **Neutral** | Standard-Gewichtung (Baseline) |
| 0.9 | **Nebensächlich** | Weniger wichtige, aber noch relevante Faktoren |
| 0.8 | **Unwichtig** | Faktoren mit geringster Priorität |
| 0.0 | **Deaktiviert** | Kategorie wird komplett von der Bewertung ausgeschlossen |

## Standard-Gewichtungen der Kategorien-Gruppen

### 🎓 Bildung (Gewichtung: 1.0 - Neutral)
Bildungseinrichtungen sind wichtig für Familien und langfristige Entwicklung.

- **Kindergärten** (1.0 - Neutral): Grundversorgung für Familien mit Kleinkindern
- **Schulen** (1.2 - Sehr wichtig): Kritisch für Familien mit schulpflichtigen Kindern
- **Hochschulen** (0.8 - Unwichtig): Relevant für Studenten und akademisches Umfeld

### 🏥 Gesundheit (Gewichtung: 1.1 - Wichtig)
Gesundheitsversorgung ist ein wichtiger Faktor für alle Altersgruppen.

- **Ärzte** (1.2 - Sehr wichtig): Kritische medizinische Grundversorgung
- **Apotheken** (1.0 - Neutral): Wichtig für Medikamentenbeschaffung

### 🎭 Freizeit (Gewichtung: 0.9 - Nebensächlich)
Freizeitangebote verbessern die Lebensqualität, sind aber nicht lebensnotwendig.

- **Kultur** (0.8 - Unwichtig): Museen, Theater, Bibliotheken
- **Sport** (1.0 - Neutral): Fitnessstudios, Schwimmbäder, Sportanlagen
- **Parks** (1.1 - Wichtig): Grünflächen für Erholung und Luftqualität
- **Restaurants** (0.8 - Unwichtig): Gastronomie und kulinarische Vielfalt

### 🚌 Nahverkehr (Gewichtung: 1.0 - Neutral)
Öffentliche Verkehrsmittel sind wichtig für Mobilität ohne Auto.

- **ÖPNV** (1.3 - Sehr wichtig): Bus, Bahn, U-Bahn für tägliche Mobilität

### 🛒 Alltag (Gewichtung: 1.0 - Neutral)
Täglich benötigte Services und Einrichtungen.

- **Supermärkte** (1.2 - Sehr wichtig): Grundversorgung mit Lebensmitteln
- **Shopping** (0.8 - Unwichtig): Einzelhandel und Einkaufsmöglichkeiten
- **Banken** (0.6 - Unwichtig): Finanzdienstleistungen
- **Sicherheit** (1.1 - Wichtig): Polizei und Feuerwehr
- **Services** (0.7 - Unwichtig): Post, Tankstellen
- **Friseur** (0.8 - Unwichtig): Persönliche Dienstleistungen

> **Hinweis**: Kategorien können mit Gewichtung 0.0 komplett deaktiviert werden.

## Besondere Faktoren

### ⚠️ Belastungsfaktoren
Diese Faktoren werden **negativ** in die Bewertung einbezogen:

- **Lärmbelastung**: Simulierte Werte basierend auf Verkehrsdichte
- **Verkehrsbelastung**: Simulierte Werte basierend auf Straßentyp und -dichte

Die Belastungsfaktoren werden wie folgt berechnet:
```
Lärm-Penalty = (10 - Lärmwert) × 0.1
Verkehr-Penalty = (10 - Verkehrswert) × 0.1
```

## Anpassung der Gewichtungen

### In der Benutzeroberfläche
1. **Kategorien aufklappen**: Klicken Sie auf eine Kategorie-Gruppe
2. **Bearbeiten-Modus aktivieren**: Klicken Sie auf "✏️ Bearbeiten"
3. **Gewichtungen anpassen**: Verwenden Sie die Dropdown-Menüs
4. **Fertigstellen**: Klicken Sie auf "✓ Fertig"

### Auswirkungen von Gewichtungsänderungen
- **Höhere Gewichtung** (1.1-1.2): Faktoren werden stärker in die Gesamtbewertung einbezogen
- **Niedrigere Gewichtung** (0.8-0.9): Faktoren haben weniger Einfluss auf die Gesamtbewertung
- **Gewichtung 0.0**: Kategorien werden komplett von der Bewertung ausgeschlossen
- **Checkbox deaktiviert**: Kategorien werden temporär ausgeschlossen (können wieder aktiviert werden)

## Beispiel-Berechnung

Für eine exemplarische Berechnung mit folgenden Werten:
- Bildung-Gruppe (1.0) → Schulen (1.2) = Score 8
- Gesundheit-Gruppe (1.1) → Ärzte (1.2) = Score 6

```
Finale Gewichtung Schulen: 1.0 × 1.2 = 1.2
Finale Gewichtung Ärzte: 1.1 × 1.2 = 1.32

Gewichteter Score Schulen: 8 × 1.2 = 9.6
Gewichteter Score Ärzte: 6 × 1.32 = 7.92

Gesamtgewichtung: 1.2 + 1.32 = 2.52
Gesamtscore: (9.6 + 7.92) ÷ 2.52 = 6.95
```

## Empfohlene Gewichtungen nach Zielgruppe

### 👨‍👩‍👧‍👦 Familien mit Kindern
- **Bildung**: Sehr wichtig (1.2)
- **Sicherheit**: Sehr wichtig (1.2)
- **Parks**: Wichtig (1.1)
- **Supermärkte**: Sehr wichtig (1.2)

### 🧑‍💼 Berufstätige ohne Kinder
- **Nahverkehr**: Sehr wichtig (1.2)
- **Restaurants**: Wichtig (1.1)
- **Kultur**: Wichtig (1.1)
- **Sport**: Wichtig (1.1)

### 👴👵 Senioren
- **Gesundheit**: Sehr wichtig (1.2)
- **Nahverkehr**: Sehr wichtig (1.2)
- **Supermärkte**: Sehr wichtig (1.2)
- **Parks**: Wichtig (1.1)

### 🎓 Studenten
- **Bildung/Hochschulen**: Sehr wichtig (1.2)
- **Nahverkehr**: Sehr wichtig (1.2)
- **Restaurants**: Wichtig (1.1)
- **Kultur**: Wichtig (1.1)

## Technische Details

### Datenquellen
- **OpenStreetMap**: Geografische Daten über Einrichtungen
- **Overpass API**: Abfrage der OSM-Daten
- **Nominatim**: Adressauflösung und Reverse Geocoding

### Scoring-Algorithmus
1. **Kategorien-Scores**: Basierend auf Anzahl gefundener Einrichtungen im gewählten Radius
2. **Gewichtete Summierung**: Jeder Score wird mit seiner finalen Gewichtung multipliziert
3. **Normalisierung**: Division durch die Summe aller Gewichtungen
4. **Belastungsabzug**: Abzug von Lärm- und Verkehrsbelastung
5. **Begrenzung**: Finale Bewertung zwischen 0 und 10

### Duplikat-Filterung
Um Doppelzählungen zu vermeiden:
- **Namensähnlichkeit**: Einrichtungen mit ähnlichen Namen werden gefiltert
- **Proximität**: Einrichtungen näher als 50m werden als Duplikate betrachtet
- **Normalisierung**: Namen werden für Vergleiche normalisiert (Umlaute, Sonderzeichen)

## Tipps für optimale Ergebnisse

1. **Persönliche Prioritäten**: Passen Sie Gewichtungen an Ihre Lebenssituation an
2. **Realistische Erwartungen**: Bedenken Sie, dass kein Standort in allen Bereichen perfekt ist
3. **Suchradius anpassen**: Verwenden Sie angemessene Radien (zu Fuß: 500m, Fahrrad: 1.5km, Auto: 3km)
4. **Vergleichbare Standorte**: Bewerten Sie mehrere Standorte mit denselben Gewichtungen
5. **Aktualität beachten**: OpenStreetMap-Daten können unvollständig oder veraltet sein

---

*Diese Gewichtungen sind Standardwerte und können jederzeit in der Benutzeroberfläche angepasst werden.*
