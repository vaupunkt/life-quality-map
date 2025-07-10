import { updateMetaTags } from "./updateMetaTags"

// URL parameter management with meta tag updates
export default function updateURL(address: string, coordinates: { lat: number; lng: number }, setCurrentUrl: (url: string) => void) {
  if (typeof window === 'undefined') return // SSR check
  try {
    if (coordinates) {
      const cleanAddress = address.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
      const newUrl = `${window.location.origin}${window.location.pathname}?lat=${coordinates.lat}&lng=${coordinates.lng}`
      window.history.replaceState(null, '', newUrl)
      document.title = `Lebensqualität in ${address} - Lebensqualitäts-Karte`
      updateMetaTags(address)
      setCurrentUrl(newUrl)
    } else {
      const newUrl = `${window.location.origin}${window.location.pathname}`
      window.history.replaceState(null, '', newUrl)
      document.title = 'Lebensqualitäts-Karte - Entdecke die Lebensqualität in deiner Stadt'
      updateMetaTags(null)
      setCurrentUrl(newUrl)
    }
  } catch (error) {
    console.error('Error updating URL:', error)
  }
}