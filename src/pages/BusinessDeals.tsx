import { BusinessDealCard } from '../components/BusinessDealCard'
import { MOCK_BUSINESS_DEALS } from '../data/mockTrips'
import { filterDealsIncheonGimpo } from '../utils/departure'

const DEALS_INCHEON_GIMPO = filterDealsIncheonGimpo(MOCK_BUSINESS_DEALS)

export function BusinessDeals() {
  return (
    <div className="page business-page">
      <header className="page-header">
        <p className="page-header__eyebrow">인천·김포 출발</p>
        <h1 className="page-header__title">대한항공 · 아시아나 비즈니스 특가</h1>
        <p className="page-header__sub">
          인천/김포 출발 기준 국적기 비즈니스 특가만 모았어요
        </p>
      </header>

      <section className="card-list card-list--biz" aria-label="비즈니스 특가 목록">
        {DEALS_INCHEON_GIMPO.map((deal) => (
          <BusinessDealCard key={deal.id} deal={deal} />
        ))}
      </section>
    </div>
  )
}
