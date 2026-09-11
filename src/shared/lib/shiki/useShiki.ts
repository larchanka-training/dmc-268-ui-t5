import { useContext } from 'react'
import { ShikiContext, type ShikiContextValue } from './ShikiProvider'
export function useShiki(): ShikiContextValue {
  const context = useContext(ShikiContext)
  if (!context) {
    throw new Error('useShiki must be used within a ShikiProvider')
  }
  return context
}
