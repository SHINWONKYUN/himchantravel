import type { TabId } from '../types/app'
import type { HomeFilterId } from '../types/trip'

/** 브라우저 localStorage 키 (서버·DB 없음) */
export const STORAGE_KEYS = {
  favorites: 'ai-travel-chance:favorites',
  visited: 'ai-travel-chance:visited',
  activeTab: 'ai-travel-chance:activeTab',
  homeFilters: 'ai-travel-chance:homeFilters',
} as const

const VALID_TAB: TabId[] = ['home', 'business', 'favorites', 'myTrips']

const VALID_FILTER: HomeFilterId[] = [
  'unvisited',
  'noShopping',
  'noOption',
  'business',
  'may',
]

function safeParseStringArray(raw: string | null): string[] {
  if (raw == null || raw === '') return []
  try {
    const v = JSON.parse(raw) as unknown
    if (!Array.isArray(v)) return []
    return v.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

export function loadFavoriteIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  return new Set(safeParseStringArray(localStorage.getItem(STORAGE_KEYS.favorites)))
}

export function saveFavoriteIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify([...ids]))
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadVisitedKeys(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  return new Set(safeParseStringArray(localStorage.getItem(STORAGE_KEYS.visited)))
}

export function saveVisitedKeys(keys: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.visited, JSON.stringify([...keys]))
  } catch {
    /* ignore */
  }
}

export function loadStoredTab(): TabId | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.activeTab)
    if (raw && (VALID_TAB as string[]).includes(raw)) return raw as TabId
  } catch {
    /* ignore */
  }
  return null
}

export function saveActiveTab(tab: TabId): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.activeTab, tab)
  } catch {
    /* ignore */
  }
}

export function loadHomeFilters(): Set<HomeFilterId> {
  if (typeof window === 'undefined') return new Set()
  const arr = safeParseStringArray(localStorage.getItem(STORAGE_KEYS.homeFilters))
  const next = new Set<HomeFilterId>()
  for (const x of arr) {
    if ((VALID_FILTER as string[]).includes(x)) next.add(x as HomeFilterId)
  }
  return next
}

export function saveHomeFilters(filters: Set<HomeFilterId>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.homeFilters, JSON.stringify([...filters]))
  } catch {
    /* ignore */
  }
}
