import type { BusinessDeal, Trip } from '../types/trip'

export function isIncheonGimpoDeparture(trip: {
  departureAirport: string
}): boolean {
  return trip.departureAirport === 'ICN' || trip.departureAirport === 'GMP'
}

export function departureLineLabel(trip: {
  departureAirport: string
}): string {
  return trip.departureAirport === 'GMP' ? '김포 출발' : '인천 출발'
}

export function departureAirportName(trip: {
  departureAirport: string
}): string {
  return trip.departureAirport === 'GMP' ? '김포공항' : '인천공항'
}

export function filterTripsIncheonGimpo(trips: Trip[]): Trip[] {
  return trips.filter(isIncheonGimpoDeparture)
}

export function filterDealsIncheonGimpo(deals: BusinessDeal[]): BusinessDeal[] {
  return deals.filter(isIncheonGimpoDeparture)
}
