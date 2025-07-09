import updateURL from "./updateURL"

const handleAddressSearch = async (searchAddress: string, 
    setLoading: (loading: boolean) => void, 
    setError: (error: string) => void,
    calculateQualityScore: (lat: number, lng: number, addressName: string) => Promise<void>) => {
    if (!searchAddress.trim()) return
    updateURL(searchAddress)
    
    setLoading(true)
    setError('')

    try {
      // Geocoding API call
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(searchAddress)}`)
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