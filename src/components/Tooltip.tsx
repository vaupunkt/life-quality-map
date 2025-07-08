'use client'

import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  darkMode?: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export default function Tooltip({ content, children, darkMode = false, position = 'top', className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current
      const trigger = triggerRef.current
      const rect = trigger.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()
      
      // Check if tooltip would go off screen and adjust position
      let newPosition = position
      
      if (position === 'top' && rect.top - tooltipRect.height < 10) {
        newPosition = 'bottom'
      } else if (position === 'bottom' && rect.bottom + tooltipRect.height > window.innerHeight - 10) {
        newPosition = 'top'
      } else if (position === 'left' && rect.left - tooltipRect.width < 10) {
        newPosition = 'right'
      } else if (position === 'right' && rect.right + tooltipRect.width > window.innerWidth - 10) {
        newPosition = 'left'
      }
      
      setActualPosition(newPosition)
    }
  }, [isVisible, position])

  const getTooltipClasses = () => {
    const baseClasses = `absolute z-[9999] px-3 py-2 text-sm rounded-lg shadow-lg pointer-events-none transition-opacity duration-200 max-w-xs ${
      darkMode 
        ? 'bg-slate-700 text-gray-200 border border-slate-600' 
        : 'bg-gray-900 text-white border border-gray-700'
    }`
    
    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    }
    
    return `${baseClasses} ${positionClasses[actualPosition]} ${isVisible ? 'opacity-100' : 'opacity-0'}`
  }

  const getArrowClasses = () => {
    const arrowColor = darkMode ? 'border-slate-700' : 'border-gray-900'
    const baseArrowClasses = 'absolute w-0 h-0'
    
    const arrowPositions = {
      top: `top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${arrowColor}`,
      bottom: `bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent ${arrowColor}`,
      left: `left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent ${arrowColor}`,
      right: `right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent ${arrowColor}`
    }
    
    return `${baseArrowClasses} ${arrowPositions[actualPosition]}`
  }

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      
      <div
        ref={tooltipRef}
        className={getTooltipClasses()}
        role="tooltip"
        aria-hidden={!isVisible}
      >
        {content}
        <div className={getArrowClasses()}></div>
      </div>
    </div>
  )
}
