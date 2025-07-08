'use client'

import { useState, useEffect } from 'react'

interface InfoModalProps {
  isOpen: boolean
  onClose: () => void
  darkMode: boolean
}

export default function InfoModal({ isOpen, onClose, darkMode }: InfoModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'scoring' | 'categories' | 'weighting' | 'environment' | 'faq'>('overview')

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

  // Handler für Klick außerhalb des Modals
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: '📊' },
    { id: 'scoring', label: 'Bewertungssystem', icon: '🧮' },
    { id: 'categories', label: 'Kategorien', icon: '📋' },
    { id: 'weighting', label: 'Gewichtungen', icon: '⚖️' },
    { id: 'environment', label: 'Umweltdaten', icon: '🌍' },
    { id: 'faq', label: 'FAQ', icon: '❓' }
  ]

  const categoryMultipliers = [
    { name: 'Kindergärten', multiplier: '× 2', reason: 'Kritische Infrastruktur für Familien' },
    { name: 'Schulen', multiplier: '× 2', reason: 'Bildungsgrundversorgung' },
    { name: 'Apotheken', multiplier: '× 2', reason: 'Medizinische Notfallversorgung' },
    { name: 'Sicherheit', multiplier: '× 2', reason: 'Polizei und Feuerwehr' },
    { name: 'Friseure', multiplier: '× 2', reason: 'Persönliche Dienstleistungen' },
    { name: 'Supermärkte', multiplier: '× 1.5', reason: 'Wichtige Grundversorgung' },
    { name: 'Ärzte', multiplier: '× 1.5', reason: 'Gesundheitsversorgung' },
    { name: 'Kultur', multiplier: '× 1.5', reason: 'Lebensqualität und Bildung' },
    { name: 'Sport', multiplier: '× 1.5', reason: 'Gesundheit und Fitness' },
    { name: 'Parks', multiplier: '× 1.5', reason: 'Erholung und Luftqualität' },
    { name: 'Banken', multiplier: '× 1.5', reason: 'Finanzdienstleistungen' },
    { name: 'Services', multiplier: '× 1.5', reason: 'Alltägliche Dienstleistungen' },
    { name: 'Hochschulen', multiplier: '× 1.5', reason: 'Höhere Bildung' },
    { name: 'Restaurants', multiplier: '× 1.0', reason: 'Häufig verfügbar' },
    { name: 'Shopping', multiplier: '× 1.0', reason: 'Einzelhandel' },
    { name: 'ÖPNV', multiplier: '× 0.5', reason: 'Haltestellen sind sehr häufig' }
  ]

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
        darkMode ? 'bg-slate-800 text-gray-200' : 'bg-white text-gray-800'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>🍀</span>
              Lebensqualitäts-Karte
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-100 ${
                darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
              }`}
              aria-label="Schließen"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex flex-wrap gap-2 p-4 border-b ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? darkMode
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-500 text-white'
                  : darkMode
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <span>📊</span>
                  Willkommen zur Lebensqualitäts-Analyse
                </h3>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Diese Anwendung bewertet die Lebensqualität eines Standorts basierend auf der Verfügbarkeit 
                  verschiedener Einrichtungen und Services in der Nähe.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span>🗺️</span>
                    Datenquellen
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• OpenStreetMap (OSM) für POI-Daten</li>
                    <li>• Overpass API für Datenabfragen</li>
                    <li>• Nominatim für Geocoding</li>
                    <li>• Leaflet für Kartendarstellung</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span>⚙️</span>
                    Funktionen
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• Individuelle Gewichtung der Kategorien</li>
                    <li>• Vorgefertigte Gewichtungsprofile</li>
                    <li>• Interaktive Karte mit POI-Anzeige</li>
                    <li>• Detaillierte Bewertungsaufschlüsselung</li>
                    <li>• Umweltdaten: Klimastatistiken + Lebenszufriedenheit</li>
                    <li>• Bundesland-spezifische Datenintegration</li>
                  </ul>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-l-4 border-blue-500 ${
                darkMode ? 'bg-slate-700' : 'bg-blue-50'
              }`}>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span>🍀</span>
                  SKL Glücksatlas Integration
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Die Bewertung berücksichtigt auch die allgemeine Lebenszufriedenheit des jeweiligen 
                  Bundeslandes basierend auf Daten des SKL Glücksatlas. Diese fließt mit 10% Gewichtung 
                  in die Gesamtbewertung ein und reflektiert regionale Unterschiede in der Zufriedenheit.
                </p>
              </div>

              <div className={`p-4 rounded-lg border-l-4 border-green-500 ${
                darkMode ? 'bg-slate-700' : 'bg-green-50'
              }`}>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span>🌤️</span>
                  Klimadaten Integration
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Die Anwendung integriert auch Klimadaten basierend auf dem Klimastatusbericht 2024. 
                  Diese ersetzen die simulierten Lärm- und Verkehrsdaten und bieten reale Umweltfaktoren 
                  wie Temperatur, Niederschlag und Sonnenscheindauer für eine fundierte Bewertung.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <span>🧮</span>
                  Bewertungssystem im Detail
                </h3>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Jede Kategorie wird auf einer Skala von 0-10 bewertet, basierend auf der Anzahl und Qualität der gefundenen Einrichtungen.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3">📐 Grundformel für Kategorie-Scores</h4>
                <div className={`p-4 rounded-lg font-mono text-sm ${
                  darkMode ? 'bg-slate-700' : 'bg-gray-100'
                }`}>
                  Score = min(10, Anzahl_Einrichtungen × Multiplikator)
                </div>
                <p className="text-sm mt-2 text-gray-500">
                  Jede Kategorie wird auf maximal 10 Punkte begrenzt
                </p>
                
                <div className="mt-4">
                  <h5 className="font-semibold mb-2">Beispiele:</h5>
                  <div className="space-y-2 text-sm">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                      <strong>Supermärkte:</strong> 3 gefunden × 1.5 = 4.5 → <span className="text-yellow-500">Score: 5/10</span>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                      <strong>Kindergärten:</strong> 2 gefunden × 2.0 = 4.0 → <span className="text-yellow-500">Score: 4/10</span>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                      <strong>Schulen:</strong> 5 gefunden × 2.0 = 10.0 → <span className="text-green-500">Score: 10/10</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3">🎯 Warum 0/10 Bewertungen?</h4>
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg border-l-4 border-red-500 ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
                    <h5 className="font-semibold text-red-600 mb-2">Häufige Ursachen für 0/10 Scores:</h5>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>Keine Einrichtungen gefunden:</strong> In der Nähe befinden sich keine relevanten Einrichtungen</li>
                      <li>• <strong>Unvollständige OpenStreetMap-Daten:</strong> Einrichtungen existieren, sind aber nicht in OSM eingetragen</li>
                      <li>• <strong>API-Probleme:</strong> Overpass API überlastet oder temporär nicht verfügbar</li>
                      <li>• <strong>Zu kleiner Suchradius:</strong> Einrichtungen befinden sich außerhalb des 500m-Radius</li>
                    </ul>
                  </div>
                  
                  <div className={`p-4 rounded-lg border-l-4 border-blue-500 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <h5 className="font-semibold text-blue-600 mb-2">Lösungsansätze:</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Vergrößern Sie den Suchradius (Fahrrad: 1.5km, Auto: 3km)</li>
                      <li>• Testen Sie andere Standorte (z.B. Stadtzentren)</li>
                      <li>• Schauen Sie in den Browser-Entwicklertools nach Fehlermeldungen</li>
                      <li>• Versuchen Sie es zu einem späteren Zeitpunkt erneut</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3">⚖️ Gesamtbewertung</h4>
                <div className={`p-4 rounded-lg font-mono text-sm ${
                  darkMode ? 'bg-slate-700' : 'bg-gray-100'
                }`}>
                  Gesamtscore = Σ(Kategorie_Score × Kategorie_Gewichtung × Gruppen_Gewichtung) / Σ(Alle_Gewichtungen)
                </div>
                <p className="text-sm mt-2">
                  <strong>Beispiel:</strong> Schulen (Score: 8) × Kategorie-Gewichtung (1.2) × Bildungs-Gruppengewichtung (1.0) = 9.6 Punkte
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3">🍀 Bundesland-Lebenszufriedenheit</h4>
                <div className={`p-4 rounded-lg border-l-4 border-green-500 ${
                  darkMode ? 'bg-green-900/20' : 'bg-green-50'
                }`}>
                  <p className="text-sm mb-3">
                    Die Bewertung berücksichtigt zusätzlich die allgemeine Lebenszufriedenheit des jeweiligen Bundeslandes 
                    basierend auf dem <strong>SKL Glücksatlas</strong>.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div><strong>Datenquelle:</strong> SKL Glücksatlas (wissenschaftliche Studie zur regionalen Lebenszufriedenheit)</div>
                    <div><strong>Gewichtung:</strong> 10% der Gesamtbewertung</div>
                    <div><strong>Skala:</strong> Originalwerte von 6,17 bis 7,38 werden auf 0-10 normalisiert</div>
                    <div><strong>Beispiele:</strong> Hamburg (7,38), Bayern (7,23), Mecklenburg-Vorpommern (6,17)</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3">🔍 Debugging-Tipps</h4>
                <div className="space-y-2">
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <strong>1. Browser-Konsole öffnen:</strong> F12 → Console Tab
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <strong>2. Netzwerk-Tab prüfen:</strong> F12 → Network Tab → Filter: XHR
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <strong>3. Andere Standorte testen:</strong> Alexanderplatz Berlin, Marienplatz München
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'weighting' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <span>⚖️</span>
                  Gewichtungssystem
                </h3>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Das Gewichtungssystem ermöglicht es, die Bewertung an Ihre persönlichen Prioritäten anzupassen. 
                  Jede Kategorie und Kategoriengruppe kann individuell gewichtet werden.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3">Erlaubte Gewichtungswerte</h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className="font-bold text-emerald-500">1.2</div>
                    <div className="text-sm">Höchste Priorität</div>
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className="font-bold text-green-500">1.1</div>
                    <div className="text-sm">Hohe Priorität</div>
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className="font-bold text-blue-500">1.0</div>
                    <div className="text-sm">Normale Priorität</div>
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className="font-bold text-yellow-500">0.9</div>
                    <div className="text-sm">Niedrige Priorität</div>
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className="font-bold text-orange-500">0.8</div>
                    <div className="text-sm">Sehr niedrige Priorität</div>
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className="font-bold text-red-500">0.0</div>
                    <div className="text-sm">Ignorieren</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3">Gewichtungspresets</h4>
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">👨‍👩‍👧‍👦</span>
                      <span className="font-bold">Familie mit Kindern</span>
                    </div>
                    <p className="text-sm mb-2">Bevorzugt Bildung, Sicherheit und Gesundheit</p>
                    <div className="text-xs">
                      <strong>Bildung:</strong> 1.2 | <strong>Gesundheit:</strong> 1.1 | <strong>Sicherheit:</strong> 1.2
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">👴</span>
                      <span className="font-bold">Senioren</span>
                    </div>
                    <p className="text-sm mb-2">Fokus auf Gesundheit und Nahverkehr</p>
                    <div className="text-xs">
                      <strong>Gesundheit:</strong> 1.2 | <strong>Nahverkehr:</strong> 1.2 | <strong>Sicherheit:</strong> 1.1
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🎓</span>
                      <span className="font-bold">Studenten</span>
                    </div>
                    <p className="text-sm mb-2">Bevorzugt Bildung, Kultur und Nahverkehr</p>
                    <div className="text-xs">
                      <strong>Bildung:</strong> 1.2 | <strong>Kultur:</strong> 1.1 | <strong>Nahverkehr:</strong> 1.2
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">💼</span>
                      <span className="font-bold">Berufstätige</span>
                    </div>
                    <p className="text-sm mb-2">Fokus auf Nahverkehr und Alltag</p>
                    <div className="text-xs">
                      <strong>Nahverkehr:</strong> 1.2 | <strong>Alltag:</strong> 1.1 | <strong>Sicherheit:</strong> 1.1
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🏃</span>
                      <span className="font-bold">Aktive Lifestyle</span>
                    </div>
                    <p className="text-sm mb-2">Bevorzugt Sport, Parks und Kultur</p>
                    <div className="text-xs">
                      <strong>Freizeit:</strong> 1.2 | <strong>Sport:</strong> 1.2 | <strong>Parks:</strong> 1.1
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3">Berechnung der Gesamtbewertung</h4>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <p className="text-sm mb-2">
                    Die Gesamtbewertung wird wie folgt berechnet:
                  </p>
                  <ol className="text-sm space-y-1 ml-4">
                    <li>1. Für jede Kategorie wird der Basis-Score mit der Kategoriengewichtung multipliziert</li>
                    <li>2. Die gewichteten Kategorie-Scores werden zu einem Gruppen-Score zusammengefasst</li>
                    <li>3. Der Gruppen-Score wird mit der Gruppengewichtung multipliziert</li>
                    <li>4. Alle gewichteten Gruppen-Scores werden gemittelt</li>
                    <li>5. Das Ergebnis wird auf eine Skala von 0-10 normiert</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <span>📋</span>
                  Kategorie-Multiplikatoren
                </h3>
                <p className="text-sm mb-4">
                  Verschiedene Einrichtungstypen erhalten unterschiedliche Multiplikatoren basierend auf ihrer Wichtigkeit:
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className={`w-full border-collapse border ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                  <thead>
                    <tr className={`${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                      <th className={`border p-3 text-left ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>Kategorie</th>
                      <th className={`border p-3 text-left ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>Multiplikator</th>
                      <th className={`border p-3 text-left ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>Begründung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryMultipliers.map((cat, index) => (
                      <tr key={index} className={index % 2 === 0 ? (darkMode ? 'bg-slate-800' : 'bg-white') : (darkMode ? 'bg-slate-750' : 'bg-gray-50')}>
                        <td className={`border p-3 ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>{cat.name}</td>
                        <td className={`border p-3 font-mono ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>{cat.multiplier}</td>
                        <td className={`border p-3 text-sm ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>{cat.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <span>❓</span>
                  Häufig gestellte Fragen
                </h3>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <h4 className="font-semibold mb-2">Warum zeigen alle Kategorien 0/10?</h4>
                  <p className="text-sm">
                    Dies kann verschiedene Ursachen haben: Overpass API überlastet, unvollständige OSM-Daten, 
                    oder der Suchradius ist zu klein. Versuchen Sie einen anderen Standort oder einen größeren Radius.
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <h4 className="font-semibold mb-2">Wie aktuell sind die Daten?</h4>
                  <p className="text-sm">
                    Die Daten stammen aus OpenStreetMap und werden täglich aktualisiert. Die Qualität variiert je nach Region 
                    und Aktivität der OSM-Community.
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <h4 className="font-semibold mb-2">Kann ich eigene Gewichtungen speichern?</h4>
                  <p className="text-sm">
                    Aktuell werden die Gewichtungen nur während der Sitzung gespeichert. Eine dauerhafte Speicherung 
                    ist für zukünftige Versionen geplant.
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <h4 className="font-semibold mb-2">Warum sind die APIs manchmal langsam?</h4>
                  <p className="text-sm">
                    Kostenlose APIs können langsam oder zeitweise nicht verfügbar sein. In einer Produktionsumgebung würden 
                    kommerzielle APIs mit SLA bessere Zuverlässigkeit bieten.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'environment' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <span>🌍</span>
                  Umweltdaten im Detail
                </h3>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Die Umweltdaten kombinieren offizielle Klimastatistiken mit regionaler Lebenszufriedenheit 
                  für eine umfassende Bewertung der Lebensqualität.
                </p>
              </div>

              {/* SKL Glücksatlas Sektion */}
              <div>
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span>🍀</span>
                  SKL Glücksatlas - Lebenszufriedenheit
                </h4>
                
                <div className={`p-4 rounded-lg border-l-4 border-blue-500 ${
                  darkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                } mb-4`}>
                  <h5 className="font-semibold text-blue-600 mb-2">Datenquelle und Methodik</h5>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Jährliche Studie</strong> zur subjektiven Lebenszufriedenheit in Deutschland</li>
                    <li>• <strong>Skala 0-10:</strong> Bewertung der allgemeinen Lebenszufriedenheit</li>
                    <li>• <strong>16 Bundesländer</strong> mit individuellen Durchschnittswerten</li>
                    <li>• <strong>Wissenschaftliche Basis:</strong> Repräsentative Befragungen und Datenanalyse</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <h6 className="font-semibold mb-2 text-green-600">🏆 Höchste Werte</h6>
                    <div className="text-sm space-y-1">
                      <div>Hamburg: <span className="font-bold">7,38/10</span></div>
                      <div>Bayern: <span className="font-bold">7,23/10</span></div>
                      <div>Schleswig-Holstein: <span className="font-bold">7,23/10</span></div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <h6 className="font-semibold mb-2 text-orange-600">📉 Niedrigste Werte</h6>
                    <div className="text-sm space-y-1">
                      <div>Mecklenburg-Vorpommern: <span className="font-bold">6,17/10</span></div>
                      <div>Berlin: <span className="font-bold">6,63/10</span></div>
                      <div>Saarland: <span className="font-bold">6,73/10</span></div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg font-mono text-sm ${
                  darkMode ? 'bg-slate-700' : 'bg-gray-100'
                } mb-4`}>
                  <strong>Integration in Gesamtbewertung:</strong><br/>
                  Lebenszufriedenheit × 0.1 × Gesamtgewichtung = 10% der Bewertung
                </div>
              </div>

              {/* Klimadaten Sektion */}
              <div>
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span>🌤️</span>
                  Klimadaten - Klimastatusbericht 2024
                </h4>
                
                <div className={`p-4 rounded-lg border-l-4 border-green-500 ${
                  darkMode ? 'bg-green-900/20' : 'bg-green-50'
                } mb-4`}>
                  <h5 className="font-semibold text-green-600 mb-2">Datenquelle und Parameter</h5>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Deutscher Wetterdienst (DWD):</strong> Offizielle Klimastatistiken 2024</li>
                    <li>• <strong>Jahresdurchschnittstemperatur</strong> in °C</li>
                    <li>• <strong>Jährlicher Niederschlag</strong> in mm</li>
                    <li>• <strong>Jährliche Sonnenscheindauer</strong> in Stunden</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <h6 className="font-semibold mb-2 flex items-center gap-2">
                      <span>🌡️</span>
                      Temperatur-Bewertung (45% Gewichtung - Verschärft)
                    </h6>
                    <div className="text-sm space-y-2">
                      <div><strong>Idealbereich:</strong> 9-13°C = maximaler Score</div>
                      <div><strong>Sehr kalt (&lt;7°C):</strong> Score = max(0, 3 - (7-Temperatur) × 0.8)</div>
                      <div><strong>Sehr warm (&gt;16°C):</strong> Score = max(0, 3 - (Temperatur-16) × 0.7)</div>
                      <div><strong>Außerhalb ideal:</strong> Starker Abfall mit Penalty × 2.5</div>
                      <div className="text-green-600"><strong>Beispiel:</strong> Hamburg 11,3°C → Score: 10/10</div>
                     
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <h6 className="font-semibold mb-2 flex items-center gap-2">
                      <span>🌧️</span>
                      Niederschlag-Bewertung (35% Gewichtung - Verschärft)
                    </h6>
                    <div className="text-sm space-y-2">
                      <div><strong>Idealbereich:</strong> 750-850mm/Jahr = maximaler Score</div>
                      <div><strong>Sehr trocken (&lt;500mm):</strong> Score = max(0, 2 - (500-Niederschlag) ÷ 100)</div>
                      <div><strong>Sehr nass (&gt;1200mm):</strong> Score = max(0, 2 - (Niederschlag-1200) ÷ 150)</div>
                      <div><strong>Engerer Idealbereich:</strong> Nur ±50mm um 800mm = voller Score</div>
                      <div className="text-orange-600"><strong>Beispiel:</strong> Bayern 1070,4mm → Score: 4/10</div>
                     
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <h6 className="font-semibold mb-2 flex items-center gap-2">
                      <span>☀️</span>
                      Sonnenschein-Bewertung (20% Gewichtung - Verschärft)
                    </h6>
                    <div className="text-sm space-y-2">
                      <div><strong>Idealbereich:</strong> 1600-1800h/Jahr = maximaler Score</div>
                      <div><strong>Zu wenig (&lt;1200h):</strong> Score = max(1, (Sonnenstunden ÷ 1200) × 6)</div>
                      <div><strong>Zu viel (&gt;2200h):</strong> Score = max(2, 8 - (Sonnenstunden-2200) ÷ 100)</div>
                      <div><strong>Optimal bei 1700h:</strong> Weniger Gewichtung, aber präzisere Bewertung</div>
                      <div className="text-green-600"><strong>Beispiel:</strong> Brandenburg 1851,1h → Score: 8/10</div>
                     
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border-l-4 border-red-500 ${
                    darkMode ? 'bg-red-900/20' : 'bg-red-50'
                  }`}>
                    <h6 className="font-semibold text-red-600 mb-2">Zusätzliche Extreme-Penalty</h6>
                    <div className="text-sm space-y-1">
                      <li>• <strong>Kombinierte Extreme:</strong> -1.5 Punkte bei extremer Temperatur UND extremem Niederschlag</li>
              
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg font-mono text-sm ${
                  darkMode ? 'bg-slate-700' : 'bg-gray-100'
                } mt-4`}>
                  <strong>Klima-Gesamtscore:</strong><br/>
                  (Temperatur × 0.45) + (Niederschlag × 0.35) + (Sonnenschein × 0.2) - Extreme-Penalty
                </div>
              </div>

              {/* Technische Details */}
              <div>
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span>⚙️</span>
                  Technische Integration
                </h4>
                
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg border-l-4 border-purple-500 ${
                    darkMode ? 'bg-purple-900/20' : 'bg-purple-50'
                  }`}>
                    <h5 className="font-semibold text-purple-600 mb-2">Automatische Bundesland-Erkennung</h5>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Koordinaten aus Adresseingabe extrahieren</li>
                      <li>Nominatim Reverse Geocoding API abfragen</li>
                      <li>Bundesland aus API-Response extrahieren</li>
                      <li>Daten aus lokalen JSON-Dateien laden</li>
                      <li>Fallback für alternative Schreibweisen</li>
                    </ol>
                  </div>

                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <h5 className="font-semibold mb-2">🎯 Anwendung in der Bewertung</h5>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>Toggle-Steuerung:</strong> Umweltdaten müssen aktiviert werden</li>
                      <li>• <strong>Bundesland-Badge:</strong> Zeigt erkanntes Bundesland und Lebenszufriedenheit</li>
                      <li>• <strong>Klimadaten-Panel:</strong> Detaillierte Aufschlüsselung aller Klimawerte</li>
                      <li>• <strong>Farbkodierung:</strong> Grün (7-10), Gelb (4-6), Rot (0-3)</li>
                    </ul>
                  </div>

                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <h5 className="font-semibold mb-2">🔄 Aktualisierung der Daten</h5>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>Glücksatlas:</strong> Jährliche Updates bei neuen Veröffentlichungen</li>
                      <li>• <strong>Klimadaten:</strong> Jährliche Updates mit neuem Klimastatusbericht</li>
                      <li>• <strong>Lokale Speicherung:</strong> JSON-Dateien für schnellen Zugriff</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
