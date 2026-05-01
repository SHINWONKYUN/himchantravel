import type { RecommendationLevel, Trip } from '../types/trip'

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
    noShopping: trip.noShopping || Boolean(trip.noShoppingNote),
    noOption: trip.noOption,
    noTip: trip.noTip,
    nationalCarrier: hasNationalCarrier(trip.airline),
    businessDeal: Boolean(trip.isBusinessSpecial || trip.seatClass === '비즈니스'),
    mayDepart: hasMayDepart(trip.departDates),
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

/** 내부 정렬·필터용. 화면 표시용 라벨은 목 데이터 우선. */
export function scoreToLabel(
  score: number,
  businessDeal: boolean,
): RecommendationLevel {
  if (businessDeal) return '특가 감지'
  if (score >= 12) return '매우 추천'
  if (score >= 9) return '추천'
  if (score >= 6) return '보통'
  return '보류'
}

export function sortTripsByScore(trips: Trip[], visitedKeys: Set<string>): Trip[] {
  return [...trips].sort((a, b) => {
    const sa = computeTripScore(tripToScoreInput(a, visitedKeys))
    const sb = computeTripScore(tripToScoreInput(b, visitedKeys))
    return sb - sa
  })
}
