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

export function SearchForm() {
  const { applySearchQuery } = useApp()
  const [startDate, setStartDate] = useState<string>(defaultStartDate)
  const [duration, setDuration] = useState<DurationOption>('4박5일')
  const [travelers, setTravelers] = useState<number>(2)
  const [companion, setCompanion] = useState<CompanionType>('couple')
  const [departure, setDeparture] = useState<DepartureChoice>('ICN')
  const [purpose, setPurpose] = useState<TravelPurpose>('rest')
  const [budget, setBudget] = useState<BudgetTier>('any')
  const [preferences, setPreferences] = useState<Set<PreferenceFlag>>(
    () => new Set(),
  )

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
  }

  return (
    <div className="page search-page">
      <header className="page-header">
        <p className="page-header__eyebrow">조건 입력</p>
        <h1 className="page-header__title">여행 조건 검색</h1>
        <p className="page-header__sub">
          입력 조건에 맞는 상품만 홈 화면에 보여드립니다.
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

        <button type="submit" className="search-form__submit">
          검색
        </button>
      </form>
    </div>
  )
}
