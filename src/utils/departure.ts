import type { BusinessDeal, DepartureAirportCode, Trip } from '../types/trip'

/** MVP 초기: 인천·김포만 추천. 부산·대구·광주·청주·무안 등 지방 출발은 제외. */
const ELIGIBLE: DepartureAirportCode[] = ['ICN', 'GMP']

export function isIncheonGimpoDeparture(trip: {
  departureAirport: DepartureAirportCode
}): boolean {
  return ELIGIBLE.includes(trip.departureAirport)
}

/** 카드 한 줄용: "인천 출발" / "김포 출발" */
export function departureLineLabel(trip: {
  departureAirport: DepartureAirportCode
}): string {
  return trip.departureAirport === 'GMP' ? '김포 출발' : '인천 출발'
}

export function filterTripsIncheonGimpo(trips: Trip[]): Trip[] {
  return trips.filter(isIncheonGimpoDeparture)
}

export function filterDealsIncheonGimpo(deals: BusinessDeal[]): BusinessDeal[] {
  return deals.filter(isIncheonGimpoDeparture)
}
