import type { KeyboardEvent, MouseEvent } from 'react'
import type { Trip } from '../types/trip'
import { departureLineLabel } from '../utils/departure'

function formatWon(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`
}

function priceSignalClass(signal: string): string {
  if (signal === '특가 감지' || signal === '프리미엄') return 'travel-card__signal--deal'
  if (signal === '가격 좋음') return 'travel-card__signal--good'
  return 'travel-card__signal--wait'
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) return 'rank-badge--gold'
  if (rank === 2) return 'rank-badge--silver'
  if (rank === 3) return 'rank-badge--bronze'
  return 'rank-badge--gray'
}

type Props = {
  trip: Trip
  saved: boolean
  onToggleSave: () => void
  rank?: number
  onSelect?: () => void
}

export function TravelCard({
  trip,
  saved,
  onToggleSave,
  rank,
  onSelect,
}: Props) {
  const tags = trip.tags.slice(0, 3)
  const depart = trip.departureDates.join(', ')
  const departShort = `${departureLineLabel(trip)} · ${depart}`
  const isBusiness = trip.seatClass === '비즈니스'

  const handleHeartClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onToggleSave()
  }

  const handleCardClick = () => {
    if (onSelect) onSelect()
  }

  const handleCardKey = (e: KeyboardEvent<HTMLElement>) => {
    if (!onSelect) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  }

  const interactive = Boolean(onSelect)

  return (
    <article
      className={`travel-card travel-card--flat${isBusiness ? ' travel-card--biz-hint' : ''}${interactive ? ' travel-card--interactive' : ''}`}
      onClick={interactive ? handleCardClick : undefined}
      onKeyDown={interactive ? handleCardKey : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `${trip.productTitle} 상세 보기` : undefined}
    >
      <div className="travel-card__body">
        <header className="travel-card__head">
          <div className="travel-card__title-wrap">
            <div className="travel-card__lead">
              {rank ? (
                <span
                  className={`rank-badge rank-badge--inline ${rankBadgeClass(rank)}`}
                >
                  {rank}위
                </span>
              ) : null}
              <p className="travel-card__agency">{trip.agencyName}</p>
            </div>
            <h2 className="travel-card__title">{trip.productTitle}</h2>
          </div>
          <button
            type="button"
            className={`travel-card__heart${saved ? ' travel-card__heart--on' : ''}`}
            onClick={handleHeartClick}
            aria-pressed={saved}
            aria-label={saved ? '관심 해제' : '관심 저장'}
          >
            {saved ? '♥' : '♡'}
          </button>
        </header>

        <p className="travel-card__price">{formatWon(trip.price)}</p>

        <p className="travel-card__meta-line">
          {trip.duration} {trip.tripType} · {departShort}
        </p>

        <p className="travel-card__hotel">
          {'★'.repeat(trip.hotelGrade)} {trip.hotelName} · {trip.airline}{' '}
          {trip.seatClass}
        </p>

        <div className="travel-card__signal-wrap">
          <span
            className={`travel-card__signal ${priceSignalClass(trip.priceSignal)}`}
          >
            {trip.priceSignal}
          </span>
        </div>

        {tags.length > 0 ? (
          <div className="travel-card__tags">
            {tags.map((t) => (
              <span key={t} className="travel-card__tag">
                {t}
              </span>
            ))}
          </div>
        ) : null}

        <p className="travel-card__reason">
          <span className="travel-card__reason-lead">추천 이유 · </span>
          {trip.recommendation}
        </p>
      </div>
    </article>
  )
}
