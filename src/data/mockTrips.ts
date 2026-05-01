import type { BusinessDeal, Trip } from '../types/trip'
import tripsData from './trips.json'
import dealsData from './business-deals.json'

export const MOCK_TRIPS: Trip[] = tripsData as unknown as Trip[]

export const MOCK_BUSINESS_DEALS: BusinessDeal[] =
  dealsData as unknown as BusinessDeal[]

export const MY_TRIP_DESTINATIONS: string[] = [
  '오사카',
  '도쿄',
  '방콕',
  '다낭',
  '세부',
  '홍콩',
  '대만',
  '나트랑',
  '푸꾸옥',
]
