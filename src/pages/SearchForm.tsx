import { useState, type FormEvent } from 'react'
import { useApp } from '../context/AppContext'
import type {
  BudgetTier,
  CompanionType,
  DepartureChoice,
  DurationOption,
  PreferenceFlag,
  SearchQuery,
  TravelPurpose,
} from '../types/trip'

const DURATION_OPTIONS: { value: DurationOption; label: string }[] = [
  { value: '3박4일', label: '3박 4일' },
  { value: '3박5일', label: '3박 5일' },
  { value: '4박5일', label: '4박 5일' },
  { value: '4박6일', label: '4박 6일' },
  { value: '5박6일', label: '5박 6일' },
]

const COMPANION_OPTIONS: { value: CompanionType; label: string }[] = [
  { value: 'couple', label: '부부' },
  { value: 'coupleKids', label: '부부 + 아이' },
  { value: 'friends', label: '친구' },
  { value: 'solo', label: '혼자' },
  { value: 'parents', label: '부모님' },
]

const DEPARTURE_OPTIONS: { value: DepartureChoice; label: string }[] = [
  { value: 'ICN', label: '인천' },
  { value: 'GMP', label: '김포' },
  { value: 'seoul', label: '서울 (출발지 무관)' },
]

const DESTINATION_OPTIONS: { value: string; label: string }[] = [
  { value: 'DAD', label: '다낭 (DAD)' },
  { value: 'CXR', label: '나트랑 (CXR)' },
  { value: 'PQC', label: '푸꾸옥 (PQC)' },
  { value: 'HKG', label: '홍콩 (HKG)' },
  { value: 'TPE', label: '타이베이 (TPE)' },
  { value: 'BKK', label: '방콕 (BKK)' },
  { value: 'KIX', label: '오사카 (KIX)' },
  { value: 'NRT', label: '도쿄 나리타 (NRT)' },
  { value: 'HKT', label: '푸켓 (HKT)' },
  { value: 'CEB', label: '세부 (CEB)' },
]

const PURPOSE_OPTIONS: { value: TravelPurpose; label: string }[] = [
  { value: 'rest', label: '휴양' },
  { value: 'sight', label: '관광' },
  { value: 'shop', label: '쇼핑' },
  { value: 'golf', label: '골프' },
  { value: 'free', label: '자유여행' },
]

const BUDGET_OPTIONS: { value: BudgetTier; label: string }[] = [
  { value: 'under500k', label: '50만원 이하' },
  { value: '500to800k', label: '50~80만원' },
  { value: '800to1200k', label: '80~120만원' },
  { value: 'over1200k', label: '120만원 이상' },
  { value: 'any', label: '상관없음' },
]

const PREFERENCE_OPTIONS: { value: PreferenceFlag; label: string }[] = [
  { value: 'noShopping', label: '노쇼핑' },
  { value: 'noOption', label: '노옵션' },
  { value: 'noTip', label: '노팁' },
  { value: 'fiveStar', label: '5성급' },
  { value: 'national', label: '국적기' },
]

function defaultStartDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function pickFirstString(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c
  }
  return ''
}

function pickFirstNumber(...candidates: unknown[]): number {
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c
  }
  return 0
}

interface FlightOffer {
  id: string
  priceRaw: number
  priceText: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  carrier: string
  stops: number
}

function extractItineraries(payload: unknown): unknown[] {
  if (!payload || typeof payload !== 'object') return []
  const p = payload as Record<string, unknown>
  const tryPaths: unknown[] = [
    (p.data as Record<string, unknown> | undefined)?.itineraries,
    p.itineraries,
    (p.data as Record<string, unknown> | undefined)?.flights,
    p.flights,
    p.results,
    p.data,
  ]
  for (const v of tryPaths) {
    if (Array.isArray(v)) return v
  }
  return []
}

function mapToFlightOffer(item: unknown): FlightOffer | null {
  if (!item || typeof item !== 'object') return null
  const it = item as Record<string, unknown>
  const legs = (it.legs as unknown[]) ?? []
  const firstLeg = (legs[0] as Record<string, unknown>) ?? {}
  const lastLeg =
    (legs[legs.length - 1] as Record<string, unknown>) ?? firstLeg
  const price = (it.price as Record<string, unknown>) ?? {}
  const origin = (firstLeg.origin as Record<string, unknown>) ?? {}
  const destination = (lastLeg.destination as Record<string, unknown>) ?? {}
  const carriers = (firstLeg.carriers as Record<string, unknown>) ?? {}
  const marketing = (carriers.marketing as unknown[]) ?? []
  const firstCarrier = (marketing[0] as Record<string, unknown>) ?? {}
  const segments = (firstLeg.segments as unknown[]) ?? []

  const id = pickFirstString(it.id, firstLeg.id, String(Math.random()))
  const priceRaw = pickFirstNumber(price.raw, it.priceRaw, it.price)
  const priceText = pickFirstString(price.formatted, it.priceText)
  const originCode = pickFirstString(
    origin.displayCode,
    origin.id,
    origin.skyId,
    origin.code,
  )
  const destCode = pickFirstString(
    destination.displayCode,
    destination.id,
    destination.skyId,
    destination.code,
  )
  const departureTime = pickFirstString(firstLeg.departure, firstLeg.departTime)
  const arrivalTime = pickFirstString(lastLeg.arrival, lastLeg.arrivalTime)
  const durationMinutes = pickFirstNumber(
    firstLeg.durationInMinutes,
    firstLeg.duration,
  )
  const carrier = pickFirstString(firstCarrier.name, firstCarrier.alternateId)
  const stops = Math.max(0, segments.length - 1)

  if (!originCode && !destCode && priceRaw === 0) return null

  return {
    id,
    priceRaw,
    priceText,
    origin: originCode,
    destination: destCode,
    departureTime,
    arrivalTime,
    durationMinutes,
    carrier,
    stops,
  }
}

function formatTime(iso: string): string {
  if (!iso) return ''
  const m = iso.match(/T(\d{2}):(\d{2})/)
  return m ? `${m[1]}:${m[2]}` : iso
}

function formatDuration(minutes: number): string {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}시간 ${m}분`
}

function formatPrice(raw: number, fallback: string): string {
  if (raw > 0) return `${raw.toLocaleString('ko-KR')}원`
  if (fallback) return fallback
  return '-'
}

export function SearchForm() {
  const { applySearchQuery } = useApp()
  const [startDate, setStartDate] = useState<string>(defaultStartDate)
  const [duration, setDuration] = useState<DurationOption>('4박5일')
  const [travelers, setTravelers] = useState<number>(2)
  const [companion, setCompanion] = useState<CompanionType>('couple')
  const [departure, setDeparture] = useState<DepartureChoice>('ICN')
  const [destination, setDestination] = useState<string>('DAD')
  const [purpose, setPurpose] = useState<TravelPurpose>('rest')
  const [budget, setBudget] = useState<BudgetTier>('any')
  const [preferences, setPreferences] = useState<Set<PreferenceFlag>>(
    () => new Set(),
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<FlightOffer[] | null>(null)
  const [rawNotice, setRawNotice] = useState<string | null>(null)

  const togglePreference = (p: PreferenceFlag) => {
    setPreferences((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const query: SearchQuery = {
      startDate,
      duration,
      travelers,
      companion,
      departure,
      purpose,
      budget,
      preferences: [...preferences],
    }
    applySearchQuery(query)

    setLoading(true)
    setError(null)
    setResults(null)
    setRawNotice(null)

    const originCode = departure === 'seoul' ? 'ICN' : departure
    const params = new URLSearchParams({
      origin: originCode,
      dest: destination,
      date: startDate,
      adults: String(travelers),
    })

    try {
      const r = await fetch(`/api/flights?${params.toString()}`)
      const text = await r.text()
      let data: unknown = null
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('응답을 JSON으로 파싱할 수 없습니다.')
      }
      if (!r.ok) {
        const errMsg =
          (data && typeof data === 'object' && 'message' in data
            ? String((data as Record<string, unknown>).message)
            : null) || `HTTP ${r.status}`
        throw new Error(errMsg)
      }

      const list = extractItineraries(data)
      const offers = list
        .map(mapToFlightOffer)
        .filter((x): x is FlightOffer => x !== null)
      setResults(offers)

      if (offers.length === 0 && list.length > 0) {
        setRawNotice(
          `응답 형태를 매핑하지 못했습니다. 첫 항목 키: ${Object.keys(
            list[0] as Record<string, unknown>,
          ).join(', ')}`,
        )
      } else if (offers.length === 0) {
        setRawNotice('응답에 항공편 목록이 없습니다.')
      }
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as Record<string, unknown>).message)
          : '검색 실패. 다시 시도해 주세요.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page search-page">
      <header className="page-header">
        <p className="page-header__eyebrow">조건 입력</p>
        <h1 className="page-header__title">여행 조건 검색</h1>
        <p className="page-header__sub">
          입력 조건으로 실시간 항공편을 조회하고, 동시에 등록된 패키지 상품을
          홈에서 필터합니다.
        </p>
      </header>

      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-form__field">
          <label htmlFor="sf-start" className="search-form__label">
            출발일
          </label>
          <input
            id="sf-start"
            type="date"
            className="search-form__input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="search-form__field">
          <label htmlFor="sf-destination" className="search-form__label">
            도착지
          </label>
          <select
            id="sf-destination"
            className="search-form__input"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            {DESTINATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="search-form__field">
          <label htmlFor="sf-duration" className="search-form__label">
            여행 기간
          </label>
          <select
            id="sf-duration"
            className="search-form__input"
            value={duration}
            onChange={(e) => setDuration(e.target.value as DurationOption)}
          >
            {DURATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="search-form__field">
          <label htmlFor="sf-travelers" className="search-form__label">
            인원
          </label>
          <input
            id="sf-travelers"
            type="number"
            className="search-form__input"
            min={1}
            max={10}
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value) || 1)}
          />
        </div>

        <div className="search-form__field">
          <label htmlFor="sf-companion" className="search-form__label">
            동반자
          </label>
          <select
            id="sf-companion"
            className="search-form__input"
            value={companion}
            onChange={(e) => setCompanion(e.target.value as CompanionType)}
          >
            {COMPANION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="search-form__field">
          <label htmlFor="sf-departure" className="search-form__label">
            출발지
          </label>
          <select
            id="sf-departure"
            className="search-form__input"
            value={departure}
            onChange={(e) => setDeparture(e.target.value as DepartureChoice)}
          >
            {DEPARTURE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="search-form__field">
          <label htmlFor="sf-purpose" className="search-form__label">
            여행 목적
          </label>
          <select
            id="sf-purpose"
            className="search-form__input"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as TravelPurpose)}
          >
            {PURPOSE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="search-form__field">
          <label htmlFor="sf-budget" className="search-form__label">
            예산 (1인)
          </label>
          <select
            id="sf-budget"
            className="search-form__input"
            value={budget}
            onChange={(e) => setBudget(e.target.value as BudgetTier)}
          >
            {BUDGET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="search-form__fieldset">
          <legend className="search-form__label">선호 조건</legend>
          <div className="search-form__checks">
            {PREFERENCE_OPTIONS.map((p) => (
              <label key={p.value} className="search-form__check">
                <input
                  type="checkbox"
                  checked={preferences.has(p.value)}
                  onChange={() => togglePreference(p.value)}
                />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="search-form__submit"
          disabled={loading}
        >
          {loading ? '검색 중…' : '실시간 항공권 검색'}
        </button>
      </form>

      <section className="flight-results" aria-live="polite">
        <h2 className="flight-results__title">
          실시간 항공편
          {results ? ` · ${results.length}건` : ''}
        </h2>

        {loading ? (
          <div className="flight-results__loading" role="status">
            <span className="spinner" aria-hidden />
            <span>항공편을 가져오는 중…</span>
          </div>
        ) : null}

        {error ? (
          <div className="flight-results__error" role="alert">
            <p>검색 실패. 다시 시도해 주세요.</p>
            <p className="flight-results__error-detail">{error}</p>
          </div>
        ) : null}

        {!loading && !error && results && results.length > 0 ? (
          <div className="flight-list">
            {results.slice(0, 20).map((f) => (
              <article key={f.id} className="flight-card">
                <div className="flight-card__route">
                  <span className="flight-card__code">{f.origin || '?'}</span>
                  <span className="flight-card__arrow" aria-hidden>
                    →
                  </span>
                  <span className="flight-card__code">
                    {f.destination || '?'}
                  </span>
                </div>
                <div className="flight-card__times">
                  <span>{formatTime(f.departureTime)}</span>
                  <span className="flight-card__times-sep">·</span>
                  <span>{formatTime(f.arrivalTime)}</span>
                  {f.durationMinutes ? (
                    <span className="flight-card__duration">
                      ({formatDuration(f.durationMinutes)})
                    </span>
                  ) : null}
                </div>
                <div className="flight-card__meta">
                  <span className="flight-card__carrier">
                    {f.carrier || '항공사 미상'}
                  </span>
                  {f.stops > 0 ? (
                    <span className="flight-card__stops">
                      경유 {f.stops}회
                    </span>
                  ) : (
                    <span className="flight-card__stops flight-card__stops--direct">
                      직항
                    </span>
                  )}
                </div>
                <div className="flight-card__price">
                  {formatPrice(f.priceRaw, f.priceText)}
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!loading && !error && results && results.length === 0 ? (
          <div className="flight-results__empty">
            <p>조건에 맞는 항공편이 없습니다.</p>
            {rawNotice ? (
              <p className="flight-results__error-detail">{rawNotice}</p>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}
