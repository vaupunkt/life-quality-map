import { useEffect, useState } from 'react'
import type { TopPlace } from '../helper/getTopPlaces'

export function useTopPlaces(refreshKey?: number) {
  const [topPlaces, setTopPlaces] = useState<TopPlace[]>([])

  useEffect(() => {
    fetch('/api/top-places')
      .then(res => res.json())
      .then(data => setTopPlaces(data))
      .catch(() => setTopPlaces([]))
  }, [refreshKey])

  return topPlaces
}
