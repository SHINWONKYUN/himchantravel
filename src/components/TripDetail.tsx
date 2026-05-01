import { useEffect } from 'react'
import type { MouseEvent } from 'react'
import type { Trip } from '../types/trip'
import { departureAirportName } from '../utils/departure'

type Props = {
  trip: Trip
  rank: number | null
  onClose: () => void
}

function formatWon(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) return 'rank-badge--gold'
  if (rank === 2) return 'rank-badge--silver'
  if (rank === 3) return 'rank-badge--bronze'
  return 'rank-badge--gray'
}

export function TripDetail({ trip, rank, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const stop = (e: MouseEvent<HTMLDivElement>) => e.stopPropagation()

  return (
    <div
      className="trip-detail-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${trip.productTitle} 상세`}
    >
      <div className="trip-detail" onClick={stop}>
        <button
          type="button"
          className="trip-detail__close"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>

        <div className="trip-detail__head">
          {rank ? (
            <span className={`rank-badge rank-badge--detail ${rankBadgeClass(rank)}`}>
              {rank}위
            </span>
          ) : null}
          <p className="trip-detail__agency">{trip.agencyName}</p>
          <h2 className="trip-detail__title">{trip.productTitle}</h2>
          <p className="trip-detail__price">
            {formatWon(trip.price)}{' '}
            <span className="trip-detail__price-suffix">/ 1인</span>
          </p>
          <p className="trip-detail__sub">
            {trip.duration} {trip.tripType} · {departureAirportName(trip)} 출발
            · {trip.airline} {trip.seatClass}
          </p>
          <p className="trip-detail__hotel">
            {'★'.repeat(trip.hotelGrade)} {trip.hotelName} ({trip.hotelGrade}성급)
          </p>
          {trip.tags.length > 0 ? (
            <div className="trip-detail__tags">
              {trip.tags.map((t) => (
                <span key={t} className="trip-detail__tag">
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <section className="trip-detail__section">
          <h3 className="trip-detail__h3">총평</h3>
          <p className="trip-detail__summary">{trip.summary}</p>
        </section>

        <section className="trip-detail__section">
          <h3 className="trip-detail__h3">출발 가능 날짜</h3>
          <p className="trip-detail__dates">{trip.departureDates.join(', ')}</p>
        </section>

        <section className="trip-detail__section">
          <h3 className="trip-detail__h3">일자별 일정</h3>
          <ol className="trip-detail__itinerary">
            {trip.itinerary.map((day, i) => (
              <li key={i}>{day}</li>
            ))}
          </ol>
        </section>

        <section className="trip-detail__section">
          <h3 className="trip-detail__h3">포함 사항</h3>
          <ul className="trip-detail__list trip-detail__list--include">
            {trip.included.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>

        <section className="trip-detail__section">
          <h3 className="trip-detail__h3">불포함 사항</h3>
          <ul className="trip-detail__list trip-detail__list--exclude">
            {trip.excluded.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>

        <section className="trip-detail__section trip-detail__section--two">
          <div>
            <h3 className="trip-detail__h3">장점</h3>
            <ul className="trip-detail__list trip-detail__list--pros">
              {trip.pros.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="trip-detail__h3">단점</h3>
            <ul className="trip-detail__list trip-detail__list--cons">
              {trip.cons.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="trip-detail__section trip-detail__section--meta">
          <dl className="trip-detail__meta">
            <div>
              <dt>아이 동반 적합성</dt>
              <dd>{trip.childFriendly}</dd>
            </div>
            <div>
              <dt>이동 피로도</dt>
              <dd>{trip.travelFatigue}</dd>
            </div>
            <div>
              <dt>자유시간</dt>
              <dd>{trip.freeTime}</dd>
            </div>
            <div>
              <dt>쇼핑 횟수</dt>
              <dd>{trip.shoppingCount}회</dd>
            </div>
          </dl>
        </section>

        {trip.productUrl ? (
          <a
            href={trip.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="trip-detail__cta"
          >
            상품 페이지로 이동 ↗
          </a>
        ) : null}
      </div>
    </div>
  )
}
