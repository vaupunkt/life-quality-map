'use client'

import { useState, useEffect } from 'react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  radiusSettings: {
    walking: number
    cycling: number
    driving: number
    activeRadius: 'walking' | 'cycling' | 'driving'
  }
  onSave: (settings: any) => void
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  radiusSettings, 
  onSave 
}: SettingsModalProps) {
  const [tempSettings, setTempSettings] = useState(radiusSettings)

  // ESC-Taste Handler
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSave = () => {
    onSave(tempSettings)
    onClose()
  }

  const handleReset = () => {
    const defaultSettings = {
      walking: 800,
      cycling: 2000,
      driving: 5000,
      activeRadius: radiusSettings.activeRadius
    }
    setTempSettings(defaultSettings)
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Entfernungseinstellungen</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Laufbare Entfernung (Meter)
            </label>
            <input
              type="number"
              value={tempSettings.walking}
              onChange={(e) => setTempSettings({
                ...tempSettings,
                walking: parseInt(e.target.value) || 0
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="100"
              max="2000"
              step="50"
            />
            <p className="text-xs text-gray-500 mt-1">Empfohlen: 500-1000m</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fahrrad-Entfernung (Meter)
            </label>
            <input
              type="number"
              value={tempSettings.cycling}
              onChange={(e) => setTempSettings({
                ...tempSettings,
                cycling: parseInt(e.target.value) || 0
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="500"
              max="5000"
              step="100"
            />
            <p className="text-xs text-gray-500 mt-1">Empfohlen: 1500-3000m</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Auto-Entfernung (Meter)
            </label>
            <input
              type="number"
              value={tempSettings.driving}
              onChange={(e) => setTempSettings({
                ...tempSettings,
                driving: parseInt(e.target.value) || 0
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1000"
              max="10000"
              step="500"
            />
            <p className="text-xs text-gray-500 mt-1">Empfohlen: 3000-8000m</p>
          </div>
        </div>

        <div className="flex justify-between mt-6 gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Zurücksetzen
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
