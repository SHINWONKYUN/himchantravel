export type RecommendationLevel =
  | '매우 추천'
  | '추천'
  | '보통'
  | '보류'
  | '특가 감지'

export type PriceSignal = '가격 좋음' | '기다림' | '특가 감지'

/** 인천(ICN)·김포(GMP)만 MVP 추천 대상 */
export type DepartureAirportCode = 'ICN' | 'GMP'

export interface Trip {
  id: string
  destination: string
  destinationKey: string
  /** 화면·설명용 권역, 예: 서울/인천 */
  departureArea: string
  departureAirport: DepartureAirportCode
  departureAirportName: string
  /** public 기준 경로, 예: /images/trips/phu-quoc.jpg */
  coverImage?: string
  tripType: '패키지'
  duration: string
  pricePerPerson: number
  departDates: string[]
  /** 안 가본 곳 표시는 방문 목록과 결합 */
  noShopping: boolean
  noShoppingNote?: string
  noOption: boolean
  noTip: boolean
  airline: string
  seatClass: '일반석' | '비즈니스'
  reason: string
  recommendation: RecommendationLevel
  isBusinessSpecial?: boolean
  priceSignal: PriceSignal
  agencyName: string
  productTitle: string
  itinerary: string[]
  included: string[]
  excluded: string[]
  productUrl: string
  pros: string[]
  cons: string[]
  childFriendly: string
  travelFatigue: string
  freeTime: string
  summary: string
}

export interface BusinessDeal {
  id: string
  destination: string
  departureArea: string
  departureAirport: DepartureAirportCode
  departureAirportName: string
  airline: '대한항공' | '아시아나'
  seatClass: '비즈니스'
  pricePerPerson: number
  departDates: string[]
  dealDetected: boolean
  summary: string
  coverImage?: string
}

export type HomeFilterId =
  | 'unvisited'
  | 'noShopping'
  | 'noOption'
  | 'business'
  | 'may'
