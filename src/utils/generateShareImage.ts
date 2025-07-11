import { QualityScore } from "./types"

// Share-Image Generator
const generateShareImage = async (darkMode: boolean, qualityScore: QualityScore, radius: number, baseUrl: string) => {
  if (!qualityScore || !radius) return
  
  // Helper function to load map tiles
  const loadMapTile = async (lat: number, lng: number, zoom: number): Promise<HTMLImageElement | null> => {
    try {
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
  
  // Decorative circles in background (weniger auffällig)
  ctx.globalAlpha = 0.05
  for (let i = 0; i < 4; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const radius = Math.random() * 100 + 30
    
    ctx.fillStyle = darkMode ? '#10b981' : '#0284c7'
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  
  // Layout-Variables 
  const PADDING = 40
  const SECTION_SPACING = 60
  const ITEM_HEIGHT = 70
  const CONTAINER_WIDTH = canvas.width - (PADDING * 2)
  
  let currentY = 80
  
  // Header Section
  ctx.fillStyle = darkMode ? '#ffffff' : '#1f2937'
  ctx.font = 'bold 80px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('🍀', canvas.width / 2, currentY)
  currentY += 80
  
  ctx.font = 'bold 56px system-ui'
  ctx.fillText('Lebensqualitäts-Analyse', canvas.width / 2, currentY)
  currentY += SECTION_SPACING
  
  // Address
  let displayAddress = qualityScore.address
  ctx.font = 'bold 38px system-ui'
  const addressMetrics = ctx.measureText(displayAddress)
  if (addressMetrics.width > CONTAINER_WIDTH - 40) {
    // Truncate address if too long
    const words = displayAddress.split(' ')
    let shortAddress = ''
    for (const word of words) {
      const testAddress = shortAddress + (shortAddress ? ' ' : '') + word
      const testMetrics = ctx.measureText(testAddress)
      if (testMetrics.width > CONTAINER_WIDTH - 40) {
        break
      }
      shortAddress = testAddress
    }
    displayAddress = shortAddress + (shortAddress !== qualityScore.address ? '...' : '')
  }
  
  ctx.fillStyle = '#10b981'
  ctx.fillText(displayAddress, canvas.width / 2, currentY)
  currentY += SECTION_SPACING
  
  // Score Circle
  const scoreCenterX = canvas.width / 2
  const scoreCenterY = currentY + 80
  const scoreRadius = 100
  
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  ctx.shadowBlur = 20
  ctx.shadowOffsetY = 10
  
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
  
  // Score text
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 72px system-ui'
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
  ctx.shadowBlur = 4
  ctx.fillText(Math.round(score * 10) / 10 + '', scoreCenterX, scoreCenterY + 8)
  
  ctx.shadowColor = 'transparent'
  ctx.font = 'bold 28px system-ui'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.fillText('/ 10', scoreCenterX, scoreCenterY + 40)
  
  currentY = scoreCenterY + scoreRadius + SECTION_SPACING
  
  // Sort categories by score
  const allCategories = [
    { label: 'Kindergärten', emoji: '👶', score: qualityScore.kindergarten },
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
  
  const topCategories = allCategories.slice(0, 3)
  const bottomCategories = allCategories.slice(-3).reverse()
  
  // Helper function
  const drawCategoryItem = (category: typeof topCategories[0], x: number, y: number, width: number, isTop: boolean) => {
    const itemBg = isTop 
      ? (darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
      : (darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)')
    
    // Item background
    ctx.fillStyle = itemBg
    roundRect(ctx, x, y - 30, width, ITEM_HEIGHT - 10, 12)
    ctx.fill()
    
    // Emoji
    ctx.font = '40px system-ui'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#000000'
    ctx.fillText(category.emoji, x + 20, y + 10)
    
    // Label
    ctx.fillStyle = darkMode ? '#ffffff' : '#1f2937'
    ctx.font = 'bold 32px system-ui'
    ctx.fillText(category.label, x + 80, y + 8)
    
    // Score badge
    const badgeColor = category.score >= 7 ? '#10b981' : category.score >= 5 ? '#f59e0b' : '#ef4444'
    ctx.fillStyle = badgeColor
    roundRect(ctx, x + width - 80, y - 20, 60, 40, 20)
    ctx.fill()
    
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(category.score.toString(), x + width - 50, y + 6)
  }
  
  // TOP 3 Section
  ctx.fillStyle = '#10b981'
  ctx.font = 'bold 42px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('🏆 TOP 3', canvas.width / 2, currentY)
  currentY += 50
  
  topCategories.forEach((cat, index) => {
    drawCategoryItem(cat, PADDING, currentY, CONTAINER_WIDTH, true)
    currentY += ITEM_HEIGHT
  })
  
  currentY += SECTION_SPACING - 20
  
  // FLOP 3 Section
  ctx.fillStyle = '#ef4444'
  ctx.font = 'bold 42px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('📉 FLOP 3', canvas.width / 2, currentY)
  currentY += 50
  
  bottomCategories.forEach((cat, index) => {
    drawCategoryItem(cat, PADDING, currentY, CONTAINER_WIDTH, false)
    currentY += ITEM_HEIGHT
  })
  
  currentY += SECTION_SPACING
  
  // Map and Call-to-Action Section

  const mapSize = 480;
  const mapX = PADDING + 20;
  const mapY = currentY;
  const zoom = 13;
  const TILE_SIZE = 256;

  // Helper: get world pixel coordinates for lat/lng
  function getWorldPixel(lat: number, lng: number, zoom: number) {
    const sinLat = Math.sin(lat * Math.PI / 180);
    const x = ((lng + 180) / 360) * Math.pow(2, zoom) * TILE_SIZE;
    const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * Math.pow(2, zoom) * TILE_SIZE;
    return { x, y };
  }

  // Center of map in world pixel coordinates
  const centerWorld = getWorldPixel(qualityScore.lat, qualityScore.lng, zoom);

  // How many tiles do we need to cover mapSize?
  const tilesNeeded = Math.ceil(mapSize / TILE_SIZE) + 1; // +1 for overlap
  const halfMapPx = mapSize / 2;

  // Top-left world pixel of the map area
  const topLeftWorldX = centerWorld.x - halfMapPx;
  const topLeftWorldY = centerWorld.y - halfMapPx;

  // Which tile is top-left?
  const startTileX = Math.floor(topLeftWorldX / TILE_SIZE);
  const startTileY = Math.floor(topLeftWorldY / TILE_SIZE);

  // Offset in px from top-left tile to map area
  const offsetX = topLeftWorldX - startTileX * TILE_SIZE;
  const offsetY = topLeftWorldY - startTileY * TILE_SIZE;

  // Load all needed tiles
  async function loadTiles(tileXStart: number, tileYStart: number, tiles: number, zoom: number) {
    const images: Array<{img: HTMLImageElement|null, x: number, y: number}> = [];
    for (let dx = 0; dx < tiles; dx++) {
      for (let dy = 0; dy < tiles; dy++) {
        const tileX = tileXStart + dx;
        const tileY = tileYStart + dy;
        const img = await loadMapTile(
          180 / Math.PI * Math.atan(Math.sinh(Math.PI * (1 - 2 * tileY / Math.pow(2, zoom)))),
          tileX / Math.pow(2, zoom) * 360 - 180,
          zoom
        );
        images.push({img, x: dx, y: dy});
      }
    }
    return images;
  }

  let markerX = mapX + mapSize / 2;
  let markerY = mapY + mapSize / 2;

  // Draw map tiles
  const tileImages = await loadTiles(startTileX, startTileY, tilesNeeded, zoom);
  ctx.save();
  roundRect(ctx, mapX, mapY, mapSize, mapSize, 16);
  ctx.clip();
  for (const {img, x, y} of tileImages) {
    if (!img) continue;
    // Position of this tile in map area
    const drawX = mapX + x * TILE_SIZE - offsetX;
    const drawY = mapY + y * TILE_SIZE - offsetY;
    ctx.drawImage(img, drawX, drawY, TILE_SIZE, TILE_SIZE);
  }
  ctx.restore();

  ctx.strokeStyle = darkMode ? '#94a3b8' : '#64748b';
  ctx.lineWidth = 4;
  roundRect(ctx, mapX, mapY, mapSize, mapSize, 16);
  ctx.stroke();

  // Marker always in center of map
  markerX = mapX + mapSize / 2;
  markerY = mapY + mapSize / 2;

  // Location marker
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(markerX, markerY, 20, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('📍', markerX, markerY + 6);
  ctx.restore();
  
  // Radius-Text 
  const radiusText = `Werte für einen Umkreis von ${radius} Metern`
  ctx.fillStyle = darkMode ? '#94a3b8' : '#64748b'
  ctx.font = '22px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText(radiusText, mapX + mapSize / 2, mapY + mapSize + 30)
  
  // Call-to-Action
  const ctaX = mapX + mapSize + 30
  const ctaY = mapY + 40
  const ctaWidth = CONTAINER_WIDTH - mapSize - 70
  
  ctx.fillStyle = '#10b981'
  ctx.font = 'bold 32px system-ui'
  ctx.textAlign = 'left'
  
  // Call-to-Action Text
  const ctaLines = [
    qualityScore.overall === 10 ? 'Hammer! Klingt perfekt 🤩' :
    qualityScore.overall >= 8 ? 'Das ist schon fast perfekt! 🥳' :
    qualityScore.overall > 5 ? 'Scheint hier ganz ok zu sein. 👍' :
    qualityScore.overall > 3 ? 'Könnte noch besser sein! 😬' : 
    'Du hast bestimmt Gründe', qualityScore.overall < 3 ? 'hier zu wohnen ... 🙃' : '',
    '',
    'Entdecke die Lebensqualität',
    'auch in deiner Stadt!',
    'Vielleicht ist es woanders',
    'noch schöner?'
  ]
  
  ctaLines.forEach((line, index) => {
    ctx.fillText(line, ctaX, ctaY + (index * 40))
  })
  
  // additional space for the link
  ctx.fillStyle = darkMode ? '#64748b' : '#94a3b8'
  ctx.font = 'bold 22px system-ui'  
  const linkLines = [
    'Probiers aus:',
    baseUrl]
  linkLines.forEach((line, index) => {
    ctx.fillText(line, ctaX, ctaY + 350 + (index * 30))
  })
  
  // Footer
  const footerY = Math.max(mapY + mapSize + 80, canvas.height - 60)
  ctx.fillStyle = darkMode ? '#64748b' : '#94a3b8'
  ctx.font = '24px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('made with ❤️ from Greifswald', canvas.width / 2, footerY)
  
  return canvas.toDataURL('image/png')
}

// Helper function
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

export default generateShareImage