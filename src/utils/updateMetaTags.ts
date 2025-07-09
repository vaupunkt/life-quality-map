// Update Meta Tags for Social Sharing
export function updateMetaTags(address: string | null) {
  if (typeof window === 'undefined') return
  try {
    // OG Title
    const ogTitle = document.querySelector('meta[property="og:title"]')
    const title = address 
      ? `Lebensqualität in ${address} - Lebensqualitäts-Karte`
      : 'Lebensqualitäts-Karte - Entdecke die Lebensqualität in deiner Stadt'
    if (ogTitle) {
      ogTitle.setAttribute('content', title)
    } else {
      const newOgTitle = document.createElement('meta')
      newOgTitle.setAttribute('property', 'og:title')
      newOgTitle.setAttribute('content', title)
      document.head.appendChild(newOgTitle)
    }
    // OG Description
    const ogDescription = document.querySelector('meta[property="og:description"]')
    const description = address
      ? `🍀 Entdecke die Lebensqualität in ${address}! Bewertung basierend auf Bildung, Gesundheit, Freizeit und Infrastruktur.`
      : '🍀 Interaktive Karte zur Bewertung der Lebensqualität basierend auf Bildung, Gesundheit, Freizeit und Infrastruktur.'
    if (ogDescription) {
      ogDescription.setAttribute('content', description)
    } else {
      const newOgDescription = document.createElement('meta')
      newOgDescription.setAttribute('property', 'og:description')
      newOgDescription.setAttribute('content', description)
      document.head.appendChild(newOgDescription)
    }
    // OG URL
    const ogUrl = document.querySelector('meta[property="og:url"]')
    const currentUrl = window.location.href
    if (ogUrl) {
      ogUrl.setAttribute('content', currentUrl)
    } else {
      const newOgUrl = document.createElement('meta')
      newOgUrl.setAttribute('property', 'og:url')
      newOgUrl.setAttribute('content', currentUrl)
      document.head.appendChild(newOgUrl)
    }
    // Twitter Title
    const twitterTitle = document.querySelector('meta[name="twitter:title"]')
    if (twitterTitle) {
      twitterTitle.setAttribute('content', title)
    } else {
      const newTwitterTitle = document.createElement('meta')
      newTwitterTitle.setAttribute('name', 'twitter:title')
      newTwitterTitle.setAttribute('content', title)
      document.head.appendChild(newTwitterTitle)
    }
    // Twitter Description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]')
    if (twitterDescription) {
      twitterDescription.setAttribute('content', description)
    } else {
      const newTwitterDescription = document.createElement('meta')
      newTwitterDescription.setAttribute('name', 'twitter:description')
      newTwitterDescription.setAttribute('content', description)
      document.head.appendChild(newTwitterDescription)
    }
    // Twitter URL
    const twitterUrl = document.querySelector('meta[name="twitter:url"]')
    if (twitterUrl) {
      twitterUrl.setAttribute('content', currentUrl)
    } else {
      const newTwitterUrl = document.createElement('meta')
      newTwitterUrl.setAttribute('name', 'twitter:url')
      newTwitterUrl.setAttribute('content', currentUrl)
      document.head.appendChild(newTwitterUrl)
    }
  } catch (error) {
    console.error('Error updating meta tags:', error)
  }
}