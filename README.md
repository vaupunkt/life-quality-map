# Quality of Life Map

An interactive Next.js application for evaluating quality of life based on addresses.

## Features

- **Address Input**: Enter any address
- **Interactive Map**: Visualization with OpenStreetMap and Leaflet
- **Quality of Life Score**: Evaluation based on:
  - Nearby kindergartens
  - Nearby schools
  - Nearby supermarkets
  - Nearby doctors and pharmacies
  - Noise pollution (simulated)
  - Traffic congestion (simulated)
- **Weighting Presets**: Predefined weightings for different life situations
- **Environmental and Climate Data**: Integration of climate data for area evaluation
- **Category Groups**: Grouping of categories for better overview
- **Dark Mode**: Support for dark and light themes
- **Share/Copy URL**: Option to share results or copy the URL
- **Settings Modal**: Adjust weightings and settings

## Technologies

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for modern styling
- **Leaflet** for interactive maps
- **OpenStreetMap** for map data
- **Overpass API** for nearby facility data
- **Nominatim API** for geocoding

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter an address in the input field
2. Click "Evaluate"
3. The application displays:
   - An overall quality of life score
   - Individual ratings for various categories
   - The location on the interactive map
4. Use the weighting presets or manually adjust the weightings
5. Explore environmental and climate data for the selected address
6. Share the results or copy the URL for later access

## API Endpoints

- `GET /api/geocode/reverse?lat=${lat}&lon=${lng}&format=json` - Converts coordinates to an address
- `POST /api/quality-score` - Calculates quality of life scores

## Project Structure

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

## License

MIT
