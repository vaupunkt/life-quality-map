import updateURL from "./updateURL"

const handleAddressSearch = async (searchAddress: string, 
    coordinates: { lat: number; lng: number } | null,
    setLoading: (loading: boolean) => void, 
    setError: (error: string) => void,
    setCurrentUrl: (url: string) => void,
    calculateQualityScore: (lat: number, lng: number, addressName: string) => Promise<void>) => {
    if (!searchAddress.trim()) return
    if (!coordinates) {
      setError('Coordinates are required')
      return
    }
    updateURL(searchAddress, coordinates, setCurrentUrl)
    
    setLoading(true)
    setError('')

    try {
      // Geocoding API call
      const response = await fetch(`/api/geocode?lat=${coordinates.lat}&lng=${coordinates.lng}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      // Calculate quality score
      await calculateQualityScore(data.lat, data.lng, searchAddress)
    } catch (err) {
      setError('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }


export default handleAddressSearch