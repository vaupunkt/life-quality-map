import { QualityScore } from "./types"

  // Share-Funktionalität - Instagram Story Format (größere Schrift & sichtbare Karte)
  const generateShareImage = async (darkMode: boolean, qualityScore: QualityScore) => {
    if (!qualityScore) return
    
    // Helper function zum Laden von OSM-Kacheln
    const loadMapTile = async (lat: number, lng: number, zoom: number): Promise<HTMLImageElement | null> => {
      try {
        // Berechne Kachel-Koordinaten für bessere Zentrierung
        const tileX = Math.floor((lng + 180) / 360 * Math.pow(2, zoom))
        const tileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
        
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        return new Promise((resolve) => {
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
          img.src = `https://tile.openstreetmap.org/${Math.min(zoom, 13)}/${tileX}/${tileY}.png`
          
          setTimeout(() => resolve(null), 2000)
        })
      } catch (error) {
        console.error('Fehler beim Laden der Karte:', error)
        return null
      }
    }
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = 1080
    canvas.height = 1920
    
    // Modern gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    if (darkMode) {
      gradient.addColorStop(0, '#0f172a')
      gradient.addColorStop(0.5, '#1e293b') 
      gradient.addColorStop(1, '#334155')
    } else {
      gradient.addColorStop(0, '#f0f9ff')
      gradient.addColorStop(0.5, '#e0f2fe')
      gradient.addColorStop(1, '#bae6fd')
    }
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Decorative circles in background
    ctx.globalAlpha = 0.08
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const radius = Math.random() * 120 + 40
      
      ctx.fillStyle = darkMode ? '#10b981' : '#0284c7'
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    
    // Main container with glassmorphism effect
    const containerPadding = 50
    const containerX = containerPadding
    const containerY = 60
    const containerWidth = canvas.width - (containerPadding * 2)
    const containerHeight = canvas.height - 120
    
    // Glassmorphism background
    ctx.fillStyle = darkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.92)'
    ctx.filter = 'blur(0px)'
    roundRect(ctx, containerX, containerY, containerWidth, containerHeight, 32)
    ctx.fill()
    
    // Border for container
    ctx.strokeStyle = darkMode ? 'rgba(148, 163, 184, 0.4)' : 'rgba(148, 163, 184, 0.6)'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Header
    ctx.fillStyle = darkMode ? '#ffffff' : '#1f2937'
    ctx.font = 'bold 100px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('🍀', canvas.width / 2, containerY + 120)
    
    ctx.font = 'bold 72px system-ui'
    ctx.fillText('Lebensqualitäts-Analyse', canvas.width / 2, containerY + 220)
    
    // Address
    let displayAddress = qualityScore.address
    if (displayAddress.length > 25) {
      displayAddress = displayAddress.substring(0, 25) + '...'
    }
    
    ctx.font = 'bold 48px system-ui'
    ctx.fillStyle = '#10b981'
    ctx.fillText(displayAddress, canvas.width / 2, containerY + 290)
    
    // Collect and sort all categories
    const allCategories = [
      { label: 'Kindergärten', emoji: '🎓', score: qualityScore.kindergarten },
      { label: 'Schulen', emoji: '🏫', score: qualityScore.schools },
      { label: 'Hochschulen', emoji: '🎓', score: qualityScore.education },
      { label: 'Supermärkte', emoji: '🛒', score: qualityScore.supermarkets },
      { label: 'Ärzte', emoji: '🏥', score: qualityScore.doctors },
      { label: 'Apotheken', emoji: '💊', score: qualityScore.pharmacies },
      { label: 'Kultur', emoji: '🎭', score: qualityScore.culture },
      { label: 'Sport', emoji: '⚽', score: qualityScore.sports },
      { label: 'Parks', emoji: '🌳', score: qualityScore.parks },
      { label: 'ÖPNV', emoji: '🚌', score: qualityScore.transport },
      { label: 'Fahrradwege', emoji: '🚲', score: qualityScore.cycling },
      { label: 'Restaurants', emoji: '🍽️', score: qualityScore.restaurants }
    ].sort((a, b) => b.score - a.score)
    
    // Top 3 and bottom 3
    const topCategories = allCategories.slice(0, 3)
    const flopCategories = allCategories.slice(-3).reverse()
    
    // Top categories start later (after the score)
    const topStartY = containerY + 600
    
    // Score circle between location name and TOP 3
    const scoreCenterX = canvas.width / 2
    const scoreCenterY = containerY + 410
    const scoreRadius = 90
    
    // Score circle with gradient and shadow
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 25
    ctx.shadowOffsetY = 12
    
    const scoreGradient = ctx.createRadialGradient(scoreCenterX, scoreCenterY, 0, scoreCenterX, scoreCenterY, scoreRadius)
    const score = qualityScore.overall
    if (score >= 8) {
      scoreGradient.addColorStop(0, '#10b981')
      scoreGradient.addColorStop(1, '#059669')
    } else if (score >= 6) {
      scoreGradient.addColorStop(0, '#f59e0b')
      scoreGradient.addColorStop(1, '#d97706')
    } else {
      scoreGradient.addColorStop(0, '#ef4444')
      scoreGradient.addColorStop(1, '#dc2626')
    }
    
    ctx.fillStyle = scoreGradient
    ctx.beginPath()
    ctx.arc(scoreCenterX, scoreCenterY, scoreRadius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()
    
    // Score text (centered in the circle)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 80px system-ui'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = 6
    ctx.fillText(Math.round(score).toString(), scoreCenterX, scoreCenterY )
    
    ctx.shadowColor = 'transparent'
    ctx.font = 'bold 32px system-ui'
    ctx.fillStyle = darkMode ? '#e2e8f0' : '#c8ced7'
    ctx.fillText('out of 10', scoreCenterX, scoreCenterY + 35)
    ctx.fillStyle = darkMode ? '#10b981' : '#059669'
    ctx.font = 'bold 48px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('🏆 TOP 3', canvas.width / 2, topStartY)
    
    topCategories.forEach((cat, index) => {
      const y = topStartY + 80 + (index * 80)
      const itemX = containerX + 50
      const itemWidth = containerWidth - 100
      
      // Item background
      ctx.fillStyle = darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'
      roundRect(ctx, itemX, y - 35, itemWidth, 70, 16)
      ctx.fill()
      
      // Emoji (larger and fully visible)
      ctx.save()
      ctx.globalAlpha = 1.0
      ctx.font = '48px system-ui'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#000000'
      ctx.fillText(cat.emoji, itemX + 30, y + 15)
      ctx.restore()
      
      // Score badge
      ctx.fillStyle = '#10b981'
      roundRect(ctx, itemX + itemWidth - 90, y - 25, 70, 50, 25)
      ctx.fill()
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 32px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(cat.score.toString(), itemX + itemWidth - 55, y + 8)
      
      // Label
      ctx.fillStyle = darkMode ? '#ffffff' : '#000000'
      ctx.font = 'bold 36px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(cat.label, itemX + 110, y + 12)
    })
    
    // Flop categories
    const flopStartY = topStartY + 380
    ctx.fillStyle = darkMode ? '#ef4444' : '#dc2626'
    ctx.font = 'bold 48px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('📉 FLOP 3', canvas.width / 2, flopStartY)
    
    flopCategories.forEach((cat, index) => {
      const y = flopStartY + 80 + (index * 80)
      const itemX = containerX + 50
      const itemWidth = containerWidth - 100
      
      // Item background
      ctx.fillStyle = darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'
      roundRect(ctx, itemX, y - 35, itemWidth, 70, 16)
      ctx.fill()
      
      // Emoji (larger and fully opaque)
      ctx.save()
      ctx.globalAlpha = 1.0
      ctx.font = '48px system-ui'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#000000'
      ctx.fillText(cat.emoji, itemX + 30, y + 15)
      ctx.restore()
      
      // Score badge
      const badgeColor = cat.score >= 5 ? '#f59e0b' : '#ef4444'
      ctx.fillStyle = badgeColor
      roundRect(ctx, itemX + itemWidth - 90, y - 25, 70, 50, 25)
      ctx.fill()
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 32px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(cat.score.toString(), itemX + itemWidth - 55, y + 8)
      
      // Label
      ctx.fillStyle = darkMode ? '#ffffff' : '#000000'
      ctx.font = 'bold 36px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(cat.label, itemX + 110, y + 12)
    })
    
    // Square map on the left and call-to-action on the right
    const mapSize = 280  // Square size
    const mapY = flopStartY + 360
    const mapX = containerX + 50  // Left in the container
    
    // Call-to-action to the right of the map
    const ctaX = mapX + mapSize + 50  // 50px spacing from the map
    const ctaY = mapY + mapSize / 2   // Vertically centered to the map
    const ctaWidth = containerWidth - (mapSize + 150)  // Available width on the right
    
    // Call-to-action text (multi-line if needed)
    ctx.fillStyle = '#10b981'
    ctx.font = 'bold 32px system-ui'
    ctx.textAlign = 'left'
    
    // Wrap text
    const ctaText = '📱 Discover the quality of life in your city!'
    const words = ctaText.split(' ')
    const maxWidth = ctaWidth
    let line = ''
    let y = ctaY - 20  // Start position
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' '
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), ctaX, y)
      line = words[i] + ' '
      y += 40
      } else {
      line = testLine
      }
    }    ctx.fillText(line.trim(), ctaX, y)
    
    // Square OSM map
    // Attempt to load real OSM tile
    const mapTile = await loadMapTile(qualityScore.lat, qualityScore.lng, 13)
    
    if (mapTile) {
      // Draw real OSM map (square)
      ctx.save()
      
      // Clip to rounded square
      roundRect(ctx, mapX, mapY, mapSize, mapSize, 20)
      ctx.clip()
      
      // Draw OSM tile square
      ctx.drawImage(mapTile, mapX, mapY, mapSize, mapSize)
      
      ctx.restore()
      
      // Border over the map
      ctx.strokeStyle = darkMode ? '#94a3b8' : '#334155'
      ctx.lineWidth = 6
      roundRect(ctx, mapX, mapY, mapSize, mapSize, 20)
      ctx.stroke()
    } else {
      // Fallback: street grid if OSM doesn't load
      ctx.fillStyle = darkMode ? '#1e293b' : '#f8fafc'
      roundRect(ctx, mapX, mapY, mapSize, mapSize, 20)
      ctx.fill()
      
      ctx.strokeStyle = darkMode ? '#94a3b8' : '#334155'
      ctx.lineWidth = 6
      roundRect(ctx, mapX, mapY, mapSize, mapSize, 20)
      ctx.stroke()
      
      // Street grid as fallback
      ctx.strokeStyle = darkMode ? '#64748b' : '#94a3b8'
      ctx.lineWidth = 8
      
      for (let i = 1; i < 5; i++) {
      const roadY = mapY + (i * mapSize / 5)
      ctx.beginPath()
      ctx.moveTo(mapX + 30, roadY)
      ctx.lineTo(mapX + mapSize - 30, roadY)
      ctx.stroke()
      }
      
      for (let i = 1; i < 5; i++) {
      const roadX = mapX + (i * mapSize / 5)
      ctx.beginPath()
      ctx.moveTo(roadX, mapY + 30)
      ctx.lineTo(roadX, mapY + mapSize - 30)
      ctx.stroke()
      }
    }
    
    // Only the central location marker
    const centerMapX = mapX + mapSize / 2
    const centerMapY = mapY + mapSize / 2
    
    // Main marker (location) 
    ctx.save()
    ctx.globalAlpha = 1.0
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 5
    
    ctx.fillStyle = '#ef4444'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(centerMapX, centerMapY, 30, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = 3
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('📍', centerMapX, centerMapY + 10)
    ctx.restore()
    
    // Footer with "made with love" in white area
    ctx.fillStyle = darkMode ? '#64748b' : '#94a3b8'
    ctx.font = '20px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('made with ❤️ from Greifswald', canvas.width / 2, canvas.height - 90)
    
    return canvas.toDataURL('image/png')
    }
    
    // Helper function for rounded rectangles
    function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  export default generateShareImage;