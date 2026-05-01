import type { BusinessDeal } from '../types/trip'
import { departureLineLabel } from '../utils/departure'
import { CoverImage, type PlaceholderVariant } from './CoverImage'

function formatWon(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`
}

function dealPlaceholder(deal: BusinessDeal): PlaceholderVariant {
  if (deal.destination === '대만') return 'taiwan'
  if (deal.destination === '홍콩') return 'hong-kong'
  return 'business'
}

type Props = {
  deal: BusinessDeal
}

export function BusinessDealCard({ deal }: Props) {
  const depart = deal.departDates.join(' · ')
  const departLine = `${departureLineLabel(deal)} · ${depart}`
  const alt = `${deal.destination} 비즈니스 특가 이미지`

  return (
    <article className="biz-card">
      <div className="biz-card__media">
        <CoverImage
          src={deal.coverImage}
          alt={alt}
          placeholderVariant={dealPlaceholder(deal)}
          className="biz-card__cover"
          imgClassName="biz-card__img"
        />
        <div className="biz-card__media-scrim" aria-hidden />
      </div>
      <div className="biz-card__body">
        <span className="biz-card__badge">비즈니스 특가</span>
        <h2 className="biz-card__dest">{deal.destination}</h2>
        <p className="biz-card__airline">
          {deal.airline} {deal.seatClass}
        </p>
        <p className="biz-card__price">{formatWon(deal.pricePerPerson)}</p>
        <p className="biz-card__dates">{departLine}</p>
        {deal.dealDetected ? (
          <p className="biz-card__deal-flag">특가 감지</p>
        ) : null}
      </div>
    </article>
  )
}
