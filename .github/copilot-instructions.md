# Copilot Instructions for Quality of Life Map

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

This project is a Next.js application for evaluating quality of life based on addresses. The application uses:

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Leaflet** for interactive maps
- **OpenStreetMap** for map data
- **Overpass API** for nearby facility data

## Features

- Address input and geocoding
- Interactive map with Leaflet
- Calculation of quality of life scores based on:
  - Nearby kindergartens
  - Nearby schools
  - Nearby supermarkets
  - Nearby doctors/pharmacies
  - Simulated noise pollution
  - Simulated traffic congestion

## API Structure

- `/api/geocode` - Converts addresses to coordinates
- `/api/quality-score` - Calculates quality of life scores

## Important Notes

- The application uses German as the primary language
- All coordinates are in WGS84 (lat/lng)
- The map component is dynamically loaded to avoid SSR issues
- Fallback data is provided if external APIs are unavailable

## Coding Style

- Use TypeScript for all new files
- Use Tailwind CSS for styling
- Implement responsive design
- Keep API routes lean and well-structured
- Use English for comments and variable names where appropriate
