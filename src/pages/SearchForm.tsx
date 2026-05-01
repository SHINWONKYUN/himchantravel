import { useState, type FormEvent } from 'react'
import { PackageSearchCard } from '../components/PackageSearchCard'
import type {
  BudgetTier,
  CompanionType,
  DepartureChoice,
  DurationOption,
  PreferenceFlag,
  TravelPurpose,
  Trip,
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
  { value: 'TPE', label: '대만 (TPE)' },
  { value: 'BKK', label: '방콕 (BKK)' },
  { value: 'KIX', label: '오사카 (KIX)' },
  { value: 'NRT', label: '도쿄 나리타 (NRT)' },
  { value: 'HKT', label: '푸켓 (HKT)' },
  { value: 'CEB', label: '세부 (CEB)' },
]

const DESTINATION_KOREAN: Record<string, string> = {
  DAD: '다낭',
  CXR: '나트랑',
  PQC: '푸꾸옥',
  HKG: '홍콩',
  TPE: '대만',
  BKK: '방콕',
  KIX: '오사카',
  NRT: '도쿄',
  HKT: '푸켓',
  CEB: '세부',
}

const PREFERENCE_KOREAN: Record<PreferenceFlag, string> = {
  noShopping: '노쇼핑',
  noOption: '노옵션',
  noTip: '노팁',
  fiveStar: '5성급',
  national: '국적기',
}

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
  carrierLogo: string
  stops: number
  bookingUrl: string
}

function extractItineraries(payload: unknown): unknown[] {
  if (!payload || typeof payload !== 'object') return []
  const p = payload as Record<string, unknown>
  const tryPaths: unknown[] = [
    p.itineraries,
    (p.data as Record<string, unknown> | undefined)?.itineraries,
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

function readCode(field: unknown): string {
  if (typeof field === 'string') return field
  if (field && typeof field === 'object') {
    const o = field as Record<string, unknown>
    return pickFirstString(o.displayCode, o.id, o.skyId, o.code, o.iataCode)
  }
  return ''
}

function mapToFlightOffer(item: unknown): FlightOffer | null {
  if (!item || typeof item !== 'object') return null
  const it = item as Record<string, unknown>
  const legs = (it.legs as unknown[]) ?? []
  const firstLeg = (legs[0] as Record<string, unknown>) ?? {}
  const lastLeg =
    (legs[legs.length - 1] as Record<string, unknown>) ?? firstLeg
  const price = (it.price as Record<string, unknown>) ?? {}

  let firstCarrier: Record<string, unknown> = {}
  const carriersField = firstLeg.carriers
  if (Array.isArray(carriersField)) {
    firstCarrier = (carriersField[0] as Record<string, unknown>) ?? {}
  } else if (carriersField && typeof carriersField === 'object') {
    const marketing = (carriersField as Record<string, unknown>).marketing
    if (Array.isArray(marketing)) {
      firstCarrier = (marketing[0] as Record<string, unknown>) ?? {}
    }
  }

  const id = pickFirstString(it.id, firstLeg.id, String(Math.random()))
  const priceRaw = pickFirstNumber(price.amount, price.raw, it.priceRaw)
  const priceText = pickFirstString(price.formatted, it.priceText)
  const origin = readCode(firstLeg.origin)
  const destination = readCode(lastLeg.destination)
  const departureTime = pickFirstString(firstLeg.departure, firstLeg.departTime)
  const arrivalTime = pickFirstString(lastLeg.arrival, lastLeg.arrivalTime)
  const durationMinutes = pickFirstNumber(
    firstLeg.durationMinutes,
    firstLeg.durationInMinutes,
    firstLeg.duration,
  )
  const carrier = pickFirstString(
    firstCarrier.name,
    firstCarrier.alternateId,
    firstCarrier.code,
  )
  const carrierLogo = pickFirstString(
    firstCarrier.logoUrl,
    firstCarrier.logo,
  )

  let stops = 0
  const stopsField = firstLeg.stopCount
  if (typeof stopsField === 'number') {
    stops = stopsField
  } else {
    const segments = (firstLeg.segments as unknown[]) ?? []
    stops = Math.max(0, segments.length - 1)
  }

  const bookingUrl = pickFirstString(it.bookingUrl, it.deeplink, it.url)

  if (!origin && !destination && priceRaw === 0) return null

  return {
    id,
    priceRaw,
    priceText,
    origin,
    destination,
    departureTime,
    arrivalTime,
    durationMinutes,
    carrier,
    carrierLogo,
    stops,
    bookingUrl,
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

function packageToTrip(
  raw: unknown,
  destinationKorean: string,
  destinationCode: string,
  idx: number,
): Trip | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  const departureDates = Array.isArray(p.departureDates)
    ? (p.departureDates as unknown[]).map((d) => String(d)).filter(Boolean)
    : []
  const included = Array.isArray(p.included)
    ? (p.included as unknown[]).map((d) => String(d)).filter(Boolean)
    : []
  const excluded = Array.isArray(p.excluded)
    ? (p.excluded as unknown[]).map((d) => String(d)).filter(Boolean)
    : []
  const pros = Array.isArray(p.pros)
    ? (p.pros as unknown[]).map((d) => String(d)).filter(Boolean)
    : []
  const cons = Array.isArray(p.cons)
    ? (p.cons as unknown[]).map((d) => String(d)).filter(Boolean)
    : []

  const productTitle = pickFirstString(p.productTitle, p.title)
  const agencyName = pickFirstString(p.agencyName, p.agency)
  const price = pickFirstNumber(p.price, p.priceWon, p.pricePerPerson)
  if (!productTitle && !agencyName && price <= 0) return null

  const hotelGrade = Math.max(0, Math.min(5, pickFirstNumber(p.hotelGrade, p.hotelStar)))
  const tags: string[] = []
  if (p.noShopping === true) tags.push('노쇼핑')
  if (p.noOption === true) tags.push('노옵션')
  if (p.noTip === true) tags.push('노팁')
  if (hotelGrade >= 5) tags.push('5성급')

  return {
    id: `pkg-search-${destinationCode}-${idx}-${Date.now()}`,
    destination: destinationKorean,
    destinationKey: destinationCode.toLowerCase(),
    agencyName,
    productTitle,
    price,
    duration: pickFirstString(p.duration),
    tripType: '패키지',
    departureAirport: pickFirstString(p.departureAirport) || 'ICN',
    departureDates,
    airline: pickFirstString(p.airline),
    seatClass: '일반석',
    hotelName: pickFirstString(p.hotelName),
    hotelGrade,
    noShopping: p.noShopping === true,
    noOption: p.noOption === true,
    noTip: p.noTip === true,
    shoppingCount: 0,
    tags,
    recommendation: pickFirstString(p.summary, p.recommendation),
    priceSignal: '가격 좋음',
    itinerary: [],
    included,
    excluded,
    productUrl: pickFirstString(p.productUrl, p.url),
    pros,
    cons,
    childFriendly: '',
    travelFatigue: '',
    freeTime: '',
    summary: pickFirstString(p.summary),
  }
}

export function SearchForm() {
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

  const [flightLoading, setFlightLoading] = useState(false)
  const [flightError, setFlightError] = useState<string | null>(null)
  const [flightResults, setFlightResults] = useState<FlightOffer[] | null>(null)

  const [packageLoading, setPackageLoading] = useState(false)
  const [packageError, setPackageError] = useState<string | null>(null)
  const [packageResults, setPackageResults] = useState<Trip[] | null>(null)

  const togglePreference = (p: PreferenceFlag) => {
    setPreferences((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const originCode = departure === 'seoul' ? 'ICN' : departure
    const destinationKorean = DESTINATION_KOREAN[destination] ?? destination

    // 1. 항공권 (기존 로직 그대로)
    setFlightLoading(true)
    setFlightError(null)
    setFlightResults(null)

    const flightParams = new URLSearchParams({
      origin: originCode,
      dest: destination,
      date: startDate,
      adults: String(travelers),
    })

    fetch(`/api/flights?${flightParams.toString()}`)
      .then(async (r) => {
        const text = await r.text()
        let data: unknown
        try {
          data = JSON.parse(text)
        } catch {
          throw new Error('항공편 응답을 JSON으로 파싱할 수 없습니다.')
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
        setFlightResults(offers)
      })
      .catch((err) => {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? String((err as Record<string, unknown>).message)
            : '항공권 검색 실패'
        setFlightError(msg)
      })
      .finally(() => setFlightLoading(false))

    // 2. 패키지 (Claude API web_search)
    setPackageLoading(true)
    setPackageError(null)
    setPackageResults(null)

    const month = startDate.slice(0, 7) // YYYY-MM
    const prefsKorean = [...preferences]
      .map((p) => PREFERENCE_KOREAN[p])
      .filter(Boolean)

    fetch('/api/packages/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: destinationKorean,
        month,
        adults: travelers,
        preferences: prefsKorean,
      }),
    })
      .then(async (r) => {
        const text = await r.text()
        let data: unknown
        try {
          data = JSON.parse(text)
        } catch {
          throw new Error('패키지 응답을 JSON으로 파싱할 수 없습니다.')
        }
        if (!r.ok) {
          const errMsg =
            (data && typeof data === 'object' && 'message' in data
              ? String((data as Record<string, unknown>).message)
              : null) || `HTTP ${r.status}`
          throw new Error(errMsg)
        }
        const itemsRaw =
          data && typeof data === 'object' && 'items' in data
            ? (data as Record<string, unknown>).items
            : null
        const list = Array.isArray(itemsRaw) ? itemsRaw : []
        const trips = list
          .map((p, idx) => packageToTrip(p, destinationKorean, destination, idx))
          .filter((x): x is Trip => x !== null)
        setPackageResults(trips)
      })
      .catch((err) => {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? String((err as Record<string, unknown>).message)
            : '패키지 검색 실패'
        if (
          msg.toLowerCase().includes('abort') ||
          msg.includes('timeout') ||
          msg.includes('타임아웃')
        ) {
          setPackageError('검색 시간이 초과되었습니다. 다시 시도해 주세요.')
        } else if (msg.includes('anthropic_not_configured')) {
          setPackageError(
            'AI 검색 키가 아직 등록되지 않았습니다. 사장님께 알려 주세요.',
          )
        } else {
          setPackageError(`패키지 검색에 실패했습니다. (${msg})`)
        }
      })
      .finally(() => setPackageLoading(false))
  }

  return (
    <div className="page search-page">
      <header className="page-header">
        <p className="page-header__eyebrow">조건 입력</p>
        <h1 className="page-header__title">여행 조건 검색</h1>
        <p className="page-header__sub">
          입력 조건으로 실시간 항공편과 AI 패키지 검색을 동시에 진행합니다.
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
          disabled={flightLoading || packageLoading}
        >
          {flightLoading || packageLoading
            ? '검색 중…'
            : '항공권 + 패키지 검색'}
        </button>
      </form>

      <section className="flight-results" aria-live="polite">
        <h2 className="flight-results__title">
          실시간 항공편
          {flightResults ? ` · ${flightResults.length}건` : ''}
        </h2>

        {flightLoading ? (
          <div className="flight-results__loading" role="status">
            <span className="spinner" aria-hidden />
            <span>항공편을 가져오는 중…</span>
          </div>
        ) : null}

        {flightError ? (
          <div className="flight-results__error" role="alert">
            <p>검색 실패. 다시 시도해 주세요.</p>
            <p className="flight-results__error-detail">{flightError}</p>
          </div>
        ) : null}

        {!flightLoading && !flightError && flightResults && flightResults.length > 0 ? (
          <div className="flight-list">
            {flightResults.slice(0, 20).map((f) => (
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
                    {f.carrierLogo ? (
                      <img
                        src={f.carrierLogo}
                        alt=""
                        className="flight-card__logo"
                        loading="lazy"
                      />
                    ) : null}
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
                <div className="flight-card__price-cell">
                  <span className="flight-card__price">
                    {formatPrice(f.priceRaw, f.priceText)}
                  </span>
                  {f.bookingUrl ? (
                    <a
                      href={f.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flight-card__book"
                      onClick={(e) => e.stopPropagation()}
                    >
                      예약 ↗
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!flightLoading && !flightError && flightResults && flightResults.length === 0 ? (
          <div className="flight-results__empty">
            <p>조건에 맞는 항공편이 없습니다.</p>
          </div>
        ) : null}
      </section>

      <section className="package-results" aria-live="polite">
        <h2 className="package-results__title">
          패키지 상품
          {packageResults ? ` · ${packageResults.length}건` : ''}
        </h2>

        {packageLoading ? (
          <div className="package-results__loading" role="status">
            <span className="spinner" aria-hidden />
            <span>AI가 패키지를 검색하고 있습니다…</span>
            <span className="package-results__loading-hint">
              (5~20초 소요)
            </span>
          </div>
        ) : null}

        {packageError ? (
          <div className="flight-results__error" role="alert">
            <p>패키지 검색에 실패했습니다.</p>
            <p className="flight-results__error-detail">{packageError}</p>
          </div>
        ) : null}

        {!packageLoading && !packageError && packageResults && packageResults.length > 0 ? (
          <div className="package-list">
            {packageResults.map((trip) => (
              <PackageSearchCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : null}

        {!packageLoading && !packageError && packageResults && packageResults.length === 0 ? (
          <div className="flight-results__empty">
            <p>조건에 맞는 패키지를 찾지 못했습니다.</p>
            <p className="flight-results__error-detail">
              조건(도착지/출발월/선호조건)을 바꿔 다시 시도해 보세요.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  )
}
