'use client'

import { useState } from 'react'

interface InfoModalProps {
  isOpen: boolean
  onClose: () => void
  darkMode: boolean
}

export default function InfoModal({ isOpen, onClose, darkMode }: InfoModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'scoring' | 'categories' | 'weighting' | 'faq'>('overview')

  if (!isOpen) return null

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: '📊' },
    { id: 'scoring', label: 'Bewertungssystem', icon: '🧮' },
    { id: 'categories', label: 'Kategorien', icon: '📋' },
    { id: 'weighting', label: 'Gewichtungen', icon: '⚖️' },
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                    <li>• Integration von Bundesland-Lebenszufriedenheit</li>
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
        </div>
      </div>
    </div>
  )
}
