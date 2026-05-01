import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { TabId } from '../types/app'
import {
  loadFavoriteIds,
  loadStoredTab,
  loadVisitedKeys,
  saveActiveTab,
  saveFavoriteIds,
  saveVisitedKeys,
} from '../utils/storage'

export type { TabId }

type AppContextValue = {
  activeTab: TabId
  setActiveTab: (t: TabId) => void
  visitedKeys: Set<string>
  toggleVisited: (destinationKey: string) => void
  favoriteIds: Set<string>
  toggleFavorite: (tripId: string) => void
  selectedTripId: string | null
  selectedRank: number | null
  openTripDetail: (tripId: string, rank: number | null) => void
  closeTripDetail: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function readInitialTab(): TabId {
  if (typeof window === 'undefined') return 'home'
  const raw = new URLSearchParams(window.location.search).get('tab')
  if (raw === 'business' || raw === 'favorites' || raw === 'myTrips')
    return raw
  const stored = loadStoredTab()
  return stored ?? 'home'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>(readInitialTab)
  const [visitedKeys, setVisitedKeys] = useState<Set<string>>(loadVisitedKeys)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(loadFavoriteIds)
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [selectedRank, setSelectedRank] = useState<number | null>(null)

  useEffect(() => {
    saveActiveTab(activeTab)
  }, [activeTab])

  useEffect(() => {
    saveFavoriteIds(favoriteIds)
  }, [favoriteIds])

  useEffect(() => {
    saveVisitedKeys(visitedKeys)
  }, [visitedKeys])

  const toggleVisited = useCallback((destinationKey: string) => {
    setVisitedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(destinationKey)) next.delete(destinationKey)
      else next.add(destinationKey)
      return next
    })
  }, [])

  const toggleFavorite = useCallback((tripId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (next.has(tripId)) next.delete(tripId)
      else next.add(tripId)
      return next
    })
  }, [])

  const openTripDetail = useCallback(
    (tripId: string, rank: number | null) => {
      setSelectedTripId(tripId)
      setSelectedRank(rank)
    },
    [],
  )

  const closeTripDetail = useCallback(() => {
    setSelectedTripId(null)
    setSelectedRank(null)
  }, [])

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      visitedKeys,
      toggleVisited,
      favoriteIds,
      toggleFavorite,
      selectedTripId,
      selectedRank,
      openTripDetail,
      closeTripDetail,
    }),
    [
      activeTab,
      visitedKeys,
      favoriteIds,
      toggleVisited,
      toggleFavorite,
      selectedTripId,
      selectedRank,
      openTripDetail,
      closeTripDetail,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
