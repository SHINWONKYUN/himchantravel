/** 인천(ICN)·김포(GMP)만 MVP 추천 대상. BusinessDeal 등에 사용. */
export type DepartureAirportCode = 'ICN' | 'GMP'

export interface Trip {
  id: string
  destination: string
  destinationKey: string
  agencyName: string
  productTitle: string
  price: number
  duration: string
  tripType: string
  departureAirport: string
  departureDates: string[]
  airline: string
  seatClass: string
  hotelName: string
  hotelGrade: number
  noShopping: boolean
  noOption: boolean
  noTip: boolean
  shoppingCount: number
  tags: string[]
  recommendation: string
  priceSignal: string
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
  | 'noShopping'
  | 'noOption'
  | 'noTip'
  | 'fiveStar'
  | 'under1m'
  | 'nationalCarrier'

export type SortMode = 'recommended' | 'priceAsc' | 'priceDesc'

export type CompanionType =
  | 'couple'
  | 'coupleKids'
  | 'friends'
  | 'solo'
  | 'parents'

export type DurationOption = '3박4일' | '3박5일' | '4박5일' | '4박6일' | '5박6일'

export type DepartureChoice = 'ICN' | 'GMP' | 'seoul'

export type TravelPurpose = 'rest' | 'sight' | 'shop' | 'golf' | 'free'

export type BudgetTier =
  | 'under500k'
  | '500to800k'
  | '800to1200k'
  | 'over1200k'
  | 'any'

export type PreferenceFlag =
  | 'noShopping'
  | 'noOption'
  | 'noTip'
  | 'fiveStar'
  | 'national'

export interface SearchQuery {
  startDate: string
  duration: DurationOption
  travelers: number
  companion: CompanionType
  departure: DepartureChoice
  purpose: TravelPurpose
  budget: BudgetTier
  preferences: PreferenceFlag[]
}
