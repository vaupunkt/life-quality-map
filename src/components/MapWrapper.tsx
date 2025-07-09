'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapWrapperProps } from '@/app/utils/types'

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center text-gray-500">Karte wird geladen...</div>
})

export default function MapWrapper(props: MapWrapperProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div className="h-96 w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center text-gray-500">Karte wird geladen...</div>
  }

  return <Map {...props} />
}
