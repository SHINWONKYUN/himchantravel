import { useEffect, useMemo, useState } from 'react'
import { FilterChips } from '../components/FilterChips'
import { TravelCard } from '../components/TravelCard'
import { MOCK_TRIPS } from '../data/mockTrips'
import { useApp } from '../context/AppContext'
import type { HomeFilterId, SortMode, Trip } from '../types/trip'
import { filterTripsIncheonGimpo } from '../utils/departure'
import { sortTripsByScore } from '../utils/recommendationScore'
import {
  loadHomeFilters,
  loadHomeSort,
  saveHomeFilters,
  saveHomeSort,
} from '../utils/storage'

const TRIPS_INCHEON_GIMPO = filterTripsIncheonGimpo(MOCK_TRIPS)

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'recommended', label: '추천순' },
  { value: 'priceAsc', label: '낮은가격순' },
  { value: 'priceDesc', label: '높은가격순' },
]

function matchesFilters(
  trip: Trip,
  filters: Set<HomeFilterId>,
): boolean {
  if (filters.size === 0) return true
  for (const f of filters) {
    if (f === 'noShopping' && !trip.noShopping) return false
    if (f === 'noOption' && !trip.noOption) return false
    if (f === 'noTip' && !trip.noTip) return false
    if (f === 'fiveStar' && trip.hotelGrade !== 5) return false
    if (f === 'under1m' && trip.pricePerPerson > 1000000) return false
    if (
      f === 'nationalCarrier' &&
      !/대한항공|아시아나/.test(trip.airline)
    )
      return false
  }
  return true
}

function applySort(
  trips: Trip[],
  mode: SortMode,
  visitedKeys: Set<string>,
): Trip[] {
  if (mode === 'priceAsc') {
    return [...trips].sort((a, b) => a.pricePerPerson - b.pricePerPerson)
  }
  if (mode === 'priceDesc') {
    return [...trips].sort((a, b) => b.pricePerPerson - a.pricePerPerson)
  }
  return sortTripsByScore(trips, visitedKeys)
}

export function Home() {
  const { visitedKeys, favoriteIds, toggleFavorite, openTripDetail } = useApp()
  const [filters, setFilters] = useState<Set<HomeFilterId>>(loadHomeFilters)
  const [sortMode, setSortMode] = useState<SortMode>(loadHomeSort)

  useEffect(() => {
    saveHomeFilters(filters)
  }, [filters])

  useEffect(() => {
    saveHomeSort(sortMode)
  }, [sortMode])

  const toggleFilter = (id: HomeFilterId) => {
    setFilters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const trips = useMemo(() => {
    const filtered = TRIPS_INCHEON_GIMPO.filter((t) =>
      matchesFilters(t, filters),
    )
    return applySort(filtered, sortMode, visitedKeys)
  }, [visitedKeys, filters, sortMode])

  return (
    <div className="page home-page">
      <header className="page-header">
        <p className="page-header__eyebrow">인천·김포 출발 다낭 패키지</p>
        <h1 className="page-header__title">5월 다낭 여행 찬스</h1>
        <p className="page-header__sub">
          여러 여행사 다낭 패키지를 한 화면에서 비교하세요. 필터 + 정렬로 원하는
          조건을 좁힐 수 있습니다.
        </p>
        <p className="page-header__hint">
          샘플 10개 (실시간 검색 연결 예정) · 인천 출발만
        </p>
      </header>

      <FilterChips active={filters} onToggle={toggleFilter} />

      <div className="home-sort" role="group" aria-label="정렬 방식">
        <label className="home-sort__label" htmlFor="home-sort-select">
          정렬
        </label>
        <select
          id="home-sort-select"
          className="home-sort__select"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="home-sort__count">{trips.length}개</span>
      </div>

      <section className="card-list" aria-label="다낭 패키지 목록">
        {trips.length === 0 ? (
          <div className="empty-panel">
            <p className="empty-panel__title">조건에 맞는 상품이 없어요</p>
            <p className="empty-panel__sub">
              필터를 하나 줄이면 더 많은 상품을 볼 수 있어요
            </p>
          </div>
        ) : (
          trips.map((trip, idx) => {
            const rank = sortMode === 'recommended' ? idx + 1 : null
            return (
              <TravelCard
                key={trip.id}
                trip={trip}
                rank={rank ?? undefined}
                unvisited={!visitedKeys.has(trip.destinationKey)}
                saved={favoriteIds.has(trip.id)}
                onToggleSave={() => toggleFavorite(trip.id)}
                onSelect={() => openTripDetail(trip.id, rank)}
              />
            )
          })
        )}
      </section>

      <div className="future-slot" aria-hidden="true">
        <p className="future-slot__text">실시간 검색 · 준비 중</p>
      </div>
    </div>
  )
}
