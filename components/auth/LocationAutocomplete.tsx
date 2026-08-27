'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LocationAutocompleteProps {
  value: string
  onChange: (val: string) => void
}

export function LocationAutocomplete({ value, onChange }: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2 || query === value) {
      setResults([])
      setIsOpen(false)
      return
    }

    const fetchLocations = async () => {
      setLoading(true)
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`)
        const data = await res.json()
        if (data.results) {
          setResults(data.results)
          setIsOpen(true)
        } else {
          setResults([])
        }
      } catch (err) {
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchLocations, 300)
    return () => clearTimeout(timer)
  }, [query, value])

  const handleSelect = (city: any) => {
    const locationString = [city.name, city.admin1, city.country].filter(Boolean).join(', ')
    onChange(locationString)
    setQuery(locationString)
    setIsOpen(false)
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center">
        <div className="absolute left-3 text-white/40">
          <MapPin className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange(e.target.value) // Sync manual typing too
          }}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
          placeholder="Start typing your city..."
          className={cn(
            "w-full h-11 pl-10 pr-10 rounded-xl bg-[#0F1420]/50 border border-white/10 text-white text-[14px]",
            "placeholder:text-white/30 focus:outline-none focus:border-[#4F7CFF] focus:bg-[#0F1420] focus:ring-1 focus:ring-[#4F7CFF]",
            "transition-all duration-200"
          )}
        />
        <div className="absolute right-3">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-white/40" />}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0D14] border border-white/15 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <ul className="max-h-60 overflow-y-auto py-1">
            {results.map((city) => (
              <li key={city.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(city)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#4F7CFF]/10 hover:text-[#4F7CFF] transition-colors flex flex-col"
                >
                  <span className="text-[14px] font-medium text-white/90">{city.name}</span>
                  <span className="text-[11px] text-white/40">
                    {[city.admin1, city.country].filter(Boolean).join(', ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}