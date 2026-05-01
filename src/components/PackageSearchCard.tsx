import type { Trip } from '../types/trip'

type Props = {
  trip: Trip
}

function formatWon(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '가격 미상'
  return `${n.toLocaleString('ko-KR')}원`
}

function buildTags(trip: Trip): string[] {
  const out: string[] = []
  if (trip.noShopping) out.push('노쇼핑')
  if (trip.noOption) out.push('노옵션')
  if (trip.noTip) out.push('노팁')
  if (trip.hotelGrade >= 5) out.push('5성급')
  return out
}

function isSafeUrl(url: string): boolean {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function PackageSearchCard({ trip }: Props) {
  const tags = buildTags(trip)
  const includedShown = trip.included.slice(0, 3)
  const includedExtra = Math.max(0, trip.included.length - 3)
  const safeUrl = isSafeUrl(trip.productUrl) ? trip.productUrl : ''
  const hasHotel = trip.hotelName && trip.hotelGrade > 0
  const metaParts = [trip.duration, trip.departureAirport ? `${trip.departureAirport} 출발` : '', trip.airline]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="package-card">
      <header className="package-card__head">
        {trip.agencyName ? (
          <p className="package-card__agency">{trip.agencyName}</p>
        ) : null}
        <h3 className="package-card__title">
          {trip.productTitle || '상품명 미상'}
        </h3>
      </header>

      <p className="package-card__price">{formatWon(trip.price)}</p>

      {metaParts ? <p className="package-card__meta">{metaParts}</p> : null}

      {hasHotel ? (
        <p className="package-card__hotel">
          {'★'.repeat(trip.hotelGrade)} {trip.hotelName}
        </p>
      ) : null}

      {tags.length > 0 ? (
        <div className="package-card__tags">
          {tags.map((t) => (
            <span key={t} className="package-card__tag">
              {t}
            </span>
          ))}
        </div>
      ) : null}

      {includedShown.length > 0 ? (
        <div className="package-card__included">
          <span className="package-card__included-lead">포함</span>
          <ul className="package-card__included-list">
            {includedShown.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          {includedExtra > 0 ? (
            <span className="package-card__included-more">
              외 {includedExtra}개
            </span>
          ) : null}
        </div>
      ) : null}

      {trip.summary ? (
        <p className="package-card__summary">{trip.summary}</p>
      ) : null}

      {safeUrl ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="package-card__cta"
        >
          상품 보기 ↗
        </a>
      ) : (
        <span className="package-card__cta package-card__cta--disabled">
          링크 없음
        </span>
      )}
    </article>
  )
}
