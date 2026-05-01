import type { Trip } from '../types/trip'
import { departureLineLabel } from '../utils/departure'
import { CoverImage, type PlaceholderVariant } from './CoverImage'

function formatWon(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`
}

function priceSignalClass(signal: Trip['priceSignal']): string {
  if (signal === '특가 감지') return 'travel-card__signal--deal'
  if (signal === '가격 좋음') return 'travel-card__signal--good'
  return 'travel-card__signal--wait'
}

function buildTags(
  trip: Trip,
  unvisited: boolean,
  max = 3,
): string[] {
  const out: string[] = []
  if (unvisited) out.push('안 가본 곳')
  if (trip.noShopping) out.push('노쇼핑')
  else if (trip.noShoppingNote) out.push('노쇼핑 가능')
  if (trip.noOption) out.push('노옵션')
  if (trip.isBusinessSpecial && out.length < max) out.push('비즈니스')
  return out.slice(0, max)
}

function airlineLine(trip: Trip): string {
  const a = trip.airline.replace(/\s+/g, ' ').trim()
  const seat = trip.seatClass
  if (/일반석|비즈니스/.test(a)) return a
  return `${a} ${seat}`
}

function tripPlaceholder(trip: Trip): PlaceholderVariant {
  if (trip.isBusinessSpecial) return 'business'
  const m: Record<string, PlaceholderVariant> = {
    'phu-quoc': 'phu-quoc',
    'nha-trang': 'nha-trang',
    'hong-kong': 'hong-kong',
    taiwan: 'taiwan',
    'taiwan-biz': 'business',
  }
  return m[trip.id] ?? 'default'
}

type Props = {
  trip: Trip
  unvisited: boolean
  saved: boolean
  onToggleSave: () => void
}

export function TravelCard({ trip, unvisited, saved, onToggleSave }: Props) {
  const tags = buildTags(trip, unvisited)
  const depart = trip.departDates.join(', ')
  const departShort = `${departureLineLabel(trip)} · ${depart}`
  const alt = `${trip.destination} 여행 대표 이미지`

  return (
    <article
      className={`travel-card${trip.isBusinessSpecial ? ' travel-card--biz-hint' : ''}`}
    >
      <div className="travel-card__media">
        <CoverImage
          src={trip.coverImage}
          alt={alt}
          placeholderVariant={tripPlaceholder(trip)}
          className="travel-card__cover"
          imgClassName="travel-card__img"
        />
      </div>

      <div className="travel-card__body">
        <header className="travel-card__head">
          <h2 className="travel-card__title">{trip.destination}</h2>
          <button
            type="button"
            className={`travel-card__heart${saved ? ' travel-card__heart--on' : ''}`}
            onClick={onToggleSave}
            aria-pressed={saved}
            aria-label={saved ? '관심 해제' : '관심 저장'}
          >
            {saved ? '♥' : '♡'}
          </button>
        </header>

        <p className="travel-card__price">{formatWon(trip.pricePerPerson)}</p>

        <p className="travel-card__meta-line">
          {trip.duration} {trip.tripType} · {departShort}
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
          {trip.reason}
        </p>

        <p className="travel-card__airline">{airlineLine(trip)}</p>
      </div>
    </article>
  )
}
