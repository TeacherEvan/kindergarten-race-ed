import { useState } from 'react'

// Mock implementation of useKV hook for temporary testing
export function useKV<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(defaultValue)
  return [state, setState]
}