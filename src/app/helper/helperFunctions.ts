import { CategoryGroup, CategoryItem, QualityScore, WeightOption } from "@/utils/types"
import { useCallback } from "react"

 // Helper function to count total visible markers
 export const getTotalVisibleMarkers = (
    qualityScore: QualityScore,
    categoryGroups: { [key: string]: CategoryGroup }
  ): number => {
    if (!qualityScore?.amenities) return 0

    let total = 0
    const amenityKeys = [
      'kindergartens', 'schools', 'education', 'supermarkets', 'doctors', 'pharmacies', 'culture', 'sports', 'parks', 'transport', 'cycling',
      'restaurants', 'shopping', 'finance', 'safety', 'services', 'hairdresser'
    ]

    // Compute the visibility object once
    const visibility = categoryVisibility(categoryGroups || {});

    amenityKeys.forEach(key => {
      const categoryKey = key === 'kindergartens' ? 'kindergarten' :
        key === 'schools' ? 'schools' :
        key === 'education' ? 'education' :
        key === 'supermarkets' ? 'supermarkets' :
        key === 'doctors' ? 'doctors' :
        key === 'pharmacies' ? 'pharmacies' :
        key === 'culture' ? 'culture' :
        key === 'sports' ? 'sports' :
        key === 'parks' ? 'parks' :
        key === 'transport' ? 'transport' :
        key === 'cycling' ? 'cycling' :
        key === 'restaurants' ? 'restaurants' :
        key === 'shopping' ? 'shopping' :
        key === 'finance' ? 'finance' :
        key === 'safety' ? 'safety' :
        key === 'services' ? 'services' :
        key === 'hairdresser' ? 'hairdresser' : null

      if (categoryKey && visibility[categoryKey] !== false) {
        const amenities = qualityScore.amenities?.[key as keyof typeof qualityScore.amenities]
        total += amenities?.length || 0
      }
    })

    return total
  }

 export   function categoryVisibility(categoryGroups: {[key: string]: CategoryGroup}): {[key: string]: boolean} {
    return Object.values(categoryGroups).reduce((acc, group) => {
      if (group.enabled) {
        group.categories.forEach((cat: CategoryItem) => {
          acc[cat.key] = cat.enabled
        })
      } else {
        group.categories.forEach((cat: CategoryItem) => {
          acc[cat.key] = false
        })
      }
      return acc
    }, {} as {[key: string]: boolean})
    }

 export const toggleGroupVisibility = (groupKey: string, setCategoryGroups: React.Dispatch<React.SetStateAction<{[key: string]: CategoryGroup}>>) => {
    setCategoryGroups(prev => {
      const newEnabled = !prev[groupKey].enabled
      return {
        ...prev,
        [groupKey]: {
          ...prev[groupKey],
          enabled: newEnabled,
          categories: prev[groupKey].categories.map(cat => ({
            ...cat,
            enabled: newEnabled
          }))
        }
      }
    })
  }

 export const toggleCategoryVisibility = (groupKey: string, categoryKey: string, setCategoryGroups: React.Dispatch<React.SetStateAction<{[key: string]: CategoryGroup}>>
) => {
    setCategoryGroups(prev => {
      if (!prev[groupKey].enabled) return prev
      
      return {
        ...prev,
        [groupKey]: {
          ...prev[groupKey],
          categories: prev[groupKey].categories.map(cat => 
            cat.key === categoryKey ? { ...cat, enabled: !cat.enabled } : cat
          )
        }
      }
    })
  }



 export const updateCategoryWeight = (groupKey: string, categoryKey: string, weight: number, setCategoryGroups: React.Dispatch<React.SetStateAction<{[key: string]: CategoryGroup}>>
) => {
    setCategoryGroups(prev => ({
      ...prev,
      [groupKey]: {
        ...prev[groupKey],
        categories: prev[groupKey].categories.map(cat => 
          cat.key === categoryKey ? { ...cat, weight } : cat
        )
      }
    }))
  }

export const updateGroupWeight = (groupKey: string, weight: number, setCategoryGroups: React.Dispatch<React.SetStateAction<{[key: string]: CategoryGroup}>>
) => {
    setCategoryGroups(prev => ({
      ...prev,
      [groupKey]: {
        ...prev[groupKey],
        weight
      }
    }))
  }

export const getCategoryColor = (key: string) => {
    const colors: {[key: string]: string} = {
      kindergarten: 'bg-green-500',
      schools: 'bg-blue-500',
      education: 'bg-indigo-600',
      doctors: 'bg-red-500',
      pharmacies: 'bg-purple-500',
      culture: 'bg-pink-500',
      sports: 'bg-orange-500',
      parks: 'bg-emerald-500',
      transport: 'bg-indigo-500',
      cycling: 'bg-green-600',
      supermarkets: 'bg-yellow-500',
      restaurants: 'bg-yellow-600',
      shopping: 'bg-teal-600',
      finance: 'bg-green-700',
      safety: 'bg-red-700',
      services: 'bg-gray-600',
      hairdresser: 'bg-pink-400'
    }
    return colors[key] || 'bg-gray-500'
  }

  export  const getWeightLabel = (weight: number) => {
    if (weight === 0.0) return 'deaktiviert'
    if (weight >= 1.2) return 'sehr wichtig'
    if (weight >= 1.1) return 'wichtig'
    if (weight >= 1.0) return 'neutral'
    if (weight >= 0.9) return 'nebensächlich'
    return 'unwichtig'
  }

  export const weightOptions: WeightOption[] = [
    { value: 1.2, label: 'sehr wichtig' },
    { value: 1.1, label: 'wichtig' },
    { value: 1.0, label: 'neutral' },
    { value: 0.9, label: 'nebensächlich' },
    { value: 0.8, label: 'unwichtig' },
    { value: 0.0, label: 'deaktiviert' }
  ]

  export const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-green-500 to-emerald-500'
    if (score >= 6) return 'from-yellow-400 to-green-500'
    if (score >= 4) return 'from-orange-400 to-yellow-500'
    if (score >= 2) return 'from-red-400 to-orange-500'
    return 'from-red-600 to-red-500'
  }

  export const getScoreTextColor = (score: number) => {
    if (score >= 6) return 'text-white'
    return 'text-white'
  }

  export const recalculateScoreLocally = (currentScore: QualityScore, categoryGroups: {[key: string]: CategoryGroup}): QualityScore => {
    let overallScore = 0
    let totalWeight = 0

    const visibility = categoryVisibility(categoryGroups)
    
    Object.values(categoryGroups).forEach((group) => {
      if (!group.enabled) return
      
      const groupWeight = group.weight || 1.0
      
      group.categories.forEach((category) => {
        if (!category.enabled || !visibility[category.key]) return
        
        const categoryWeight = category.weight || 1.0
        
        if (categoryWeight === 0.0) return
        
        const finalWeight = groupWeight * categoryWeight
        
        const score = currentScore[category.key as keyof QualityScore] as number
        
        if (typeof score === 'number') {
          overallScore += score * finalWeight
          totalWeight += finalWeight
        }
      })
    })
    
    if (totalWeight > 0) {
      const noisePenalty = (10 - currentScore.noise) * 0.1
      const trafficPenalty = (10 - currentScore.traffic) * 0.1
      overallScore += (noisePenalty + trafficPenalty) * totalWeight
      totalWeight += 0.2 * totalWeight
    }
    
    const newOverallScore = totalWeight > 0 ? Math.round(overallScore / totalWeight) : 0
    
    return {
      ...currentScore,
      overall: Math.max(0, Math.min(10, newOverallScore))
    }
  }

export const weightingPresets = {
    default: {
      name: 'Standard',
      description: 'Ausgewogene Gewichtung für alle Nutzer',
      icon: '⚖️',
      groups: {
        bildung: { weight: 1.0, categories: { kindergarten: 1.0, schools: 1.2, education: 0.8 } },
        gesundheit: { weight: 1.1, categories: { doctors: 1.2, pharmacies: 1.0 } },
        freizeit: { weight: 0.9, categories: { culture: 0.8, sports: 1.0, parks: 1.1, restaurants: 0.8 } },
        infrastruktur: { weight: 1.0, categories: { transport: 1.2, cycling: 1.0 } },
        alltag: { weight: 1.0, categories: { supermarkets: 1.2, shopping: 0.8, finance: 0.8, safety: 1.1, services: 0.8, hairdresser: 0.8 } }
      }
    },
    familien: {
      name: 'Familien mit Kindern',
      description: 'Optimiert für Familien mit schulpflichtigen Kindern',
      icon: '👨‍👩‍👧‍👦',
      groups: {
        bildung: { weight: 1.2, categories: { kindergarten: 1.2, schools: 1.2, education: 0.8 } },
        gesundheit: { weight: 1.1, categories: { doctors: 1.2, pharmacies: 1.0 } },
        freizeit: { weight: 1.0, categories: { culture: 0.8, sports: 1.0, parks: 1.2, restaurants: 0.8 } },
        infrastruktur: { weight: 1.0, categories: { transport: 1.1, cycling: 1.1 } },
        alltag: { weight: 1.1, categories: { supermarkets: 1.2, shopping: 0.8, finance: 0.8, safety: 1.2, services: 0.8, hairdresser: 0.8 } }
      }
    },
    berufstaetige: {
      name: 'Berufstätige ohne Kinder',
      description: 'Fokus auf Mobilität und Freizeitangebote',
      icon: '🧑‍💼',
      groups: {
        bildung: { weight: 0.8, categories: { kindergarten: 0.8, schools: 0.8, education: 0.9 } },
        gesundheit: { weight: 1.0, categories: { doctors: 1.1, pharmacies: 1.0 } },
        freizeit: { weight: 1.1, categories: { culture: 1.1, sports: 1.1, parks: 1.0, restaurants: 1.1 } },
        infrastruktur: { weight: 1.2, categories: { transport: 1.2, cycling: 1.1 } },
        alltag: { weight: 1.0, categories: { supermarkets: 1.1, shopping: 1.0, finance: 0.9, safety: 1.0, services: 0.9, hairdresser: 0.9 } }
      }
    },
    senioren: {
      name: 'Senioren',
      description: 'Schwerpunkt auf Gesundheit und Grundversorgung',
      icon: '👴👵',
      groups: {
        bildung: { weight: 0.8, categories: { kindergarten: 0.8, schools: 0.8, education: 0.8 } },
        gesundheit: { weight: 1.2, categories: { doctors: 1.2, pharmacies: 1.2 } },
        freizeit: { weight: 1.0, categories: { culture: 1.0, sports: 0.9, parks: 1.1, restaurants: 0.9 } },
        infrastruktur: { weight: 1.2, categories: { transport: 1.2, cycling: 0.8 } },
        alltag: { weight: 1.1, categories: { supermarkets: 1.2, shopping: 0.8, finance: 1.0, safety: 1.1, services: 1.0, hairdresser: 0.9 } }
      }
    },
    studenten: {
      name: 'Studenten',
      description: 'Bildung, Mobilität und günstiges Leben',
      icon: '🎓',
      groups: {
        bildung: { weight: 1.2, categories: { kindergarten: 0.8, schools: 0.8, education: 1.2 } },
        gesundheit: { weight: 1.0, categories: { doctors: 1.0, pharmacies: 1.0 } },
        freizeit: { weight: 1.1, categories: { culture: 1.1, sports: 1.0, parks: 1.0, restaurants: 1.1 } },
        infrastruktur: { weight: 1.2, categories: { transport: 1.2, cycling: 1.2 } },
        alltag: { weight: 1.0, categories: { supermarkets: 1.1, shopping: 0.8, finance: 0.8, safety: 1.0, services: 0.8, hairdresser: 0.8 } }
      }
    }
  }
