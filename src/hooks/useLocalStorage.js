import { useState, useCallback } from 'react'

/**
 * Persistent state backed by localStorage.
 * Works like useState but survives page refresh.
 */
export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    setStored(prev => {
      const next = typeof value === 'function' ? value(prev) : value
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch (e) {
        console.warn('localStorage write failed:', e)
      }
      return next
    })
  }, [key])

  return [stored, setValue]
}
