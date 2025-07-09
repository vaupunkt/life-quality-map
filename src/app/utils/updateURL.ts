import { updateMetaTags } from "./updateMetaTags"

// URL parameter management with meta tag updates
export default function updateURL(address: string) {
  if (typeof window === 'undefined') return // SSR check
  try {
    if (address) {
      const cleanAddress = address.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
      const newUrl = `${window.location.origin}${window.location.pathname}?ort=${encodeURIComponent(address)}#${cleanAddress}`
      window.history.replaceState(null, '', newUrl)
      console.log('URL updated to:', newUrl)
      document.title = `Lebensqualität in ${address} - Lebensqualitäts-Karte`
      updateMetaTags(address)
    } else {
      const newUrl = `${window.location.origin}${window.location.pathname}`
      window.history.replaceState(null, '', newUrl)
      console.log('URL reset to:', newUrl)
      document.title = 'Lebensqualitäts-Karte - Entdecke die Lebensqualität in deiner Stadt'
      updateMetaTags(null)
    }
  } catch (error) {
    console.error('Error updating URL:', error)
  }
}