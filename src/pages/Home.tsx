import { useEffect, useMemo, useState } from 'react'
import { FilterChips } from '../components/FilterChips'
import { TravelCard } from '../components/TravelCard'
import { MOCK_TRIPS } from '../data/mockTrips'
import { useApp } from '../context/AppContext'
import type { HomeFilterId } from '../types/trip'
import { filterTripsIncheonGimpo } from '../utils/departure'
import { sortTripsByScore } from '../utils/recommendationScore'
import { loadHomeFilters, saveHomeFilters } from '../utils/storage'

const TRIPS_INCHEON_GIMPO = filterTripsIncheonGimpo(MOCK_TRIPS)

function matchesFilters(
  trip: (typeof TRIPS_INCHEON_GIMPO)[number],
  filters: Set<HomeFilterId>,
  visitedKeys: Set<string>,
): boolean {
  if (filters.size === 0) return true
  for (const f of filters) {
    if (f === 'unvisited' && visitedKeys.has(trip.destinationKey)) return false
    if (f === 'noShopping' && !trip.noShopping && !trip.noShoppingNote)
      return false
    if (f === 'noOption' && !trip.noOption) return false
    if (
      f === 'business' &&
      !trip.isBusinessSpecial &&
      trip.seatClass !== '비즈니스'
    )
      return false
    if (f === 'may' && !trip.departDates.some((d) => d.startsWith('5/')))
      return false
  }
  return true
}

export function Home() {
  const { visitedKeys, favoriteIds, toggleFavorite, openTripDetail } = useApp()
  const [filters, setFilters] = useState<Set<HomeFilterId>>(loadHomeFilters)

  useEffect(() => {
    saveHomeFilters(filters)
  }, [filters])

  const toggleFilter = (id: HomeFilterId) => {
    setFilters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const trips = useMemo(() => {
    const sorted = sortTripsByScore(TRIPS_INCHEON_GIMPO, visitedKeys)
    const filtered = sorted.filter((t) => matchesFilters(t, filters, visitedKeys))
    return filtered.slice(0, 5)
  }, [visitedKeys, filters])

  return (
    <div className="page home-page">
      <header className="page-header">
        <p className="page-header__eyebrow">인천·김포 출발 1년 최저가</p>
        <h1 className="page-header__title">오늘의 인천/서울 출발 여행 찬스</h1>
        <p className="page-header__sub">
          오늘 인천/김포 출발 패키지 상품 중 최근 1년 기준으로 가격이 가장 매력적인
          상품
        </p>
        <p className="page-header__hint">
          시흥에서 가기 좋은 출발 기준 · 인천/김포 출발 패키지만 · 서울 출발 기준
        </p>
      </header>

      <FilterChips active={filters} onToggle={toggleFilter} />

      <section className="card-list" aria-label="오늘의 추천 여행">
        {trips.length === 0 ? (
          <div className="empty-panel">
            <p className="empty-panel__title">조건에 맞는 여행 찬스가 없어요</p>
            <p className="empty-panel__sub">
              필터를 하나 줄이면 더 많은 상품을 볼 수 있어요
            </p>
          </div>
        ) : (
          trips.map((trip, idx) => {
            const rank = idx + 1
            return (
              <TravelCard
                key={trip.id}
                trip={trip}
                rank={rank}
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
        <p className="future-slot__text">질문형 추천 · 준비 중</p>
      </div>
    </div>
  )
}
