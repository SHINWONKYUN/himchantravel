import type { Trip } from '../types/trip'

export interface ScoreInput {
  unvisited: boolean
  noShopping: boolean
  noOption: boolean
  noTip: boolean
  nationalCarrier: boolean
  businessDeal: boolean
  mayDepart: boolean
}

function hasNationalCarrier(airline: string): boolean {
  return /대한항공|아시아나/.test(airline)
}

function hasMayDepart(dates: string[]): boolean {
  return dates.some((d) => d.startsWith('5/'))
}

export function tripToScoreInput(
  trip: Trip,
  visitedKeys: Set<string>,
): ScoreInput {
  const unvisited = !visitedKeys.has(trip.destinationKey)
  return {
    unvisited,
    noShopping: trip.noShopping,
    noOption: trip.noOption,
    noTip: trip.noTip,
    nationalCarrier: hasNationalCarrier(trip.airline),
    businessDeal: trip.seatClass === '비즈니스',
    mayDepart: hasMayDepart(trip.departureDates),
  }
}

export function computeTripScore(input: ScoreInput): number {
  let s = 0
  if (input.unvisited) s += 3
  if (input.noShopping) s += 2
  if (input.noOption) s += 2
  if (input.noTip) s += 1
  if (input.nationalCarrier) s += 2
  if (input.businessDeal) s += 5
  if (input.mayDepart) s += 1
  return s
}

export function sortTripsByScore(trips: Trip[], visitedKeys: Set<string>): Trip[] {
  return [...trips].sort((a, b) => {
    const sa = computeTripScore(tripToScoreInput(a, visitedKeys))
    const sb = computeTripScore(tripToScoreInput(b, visitedKeys))
    return sb - sa
  })
}
