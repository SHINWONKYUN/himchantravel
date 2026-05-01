import { useEffect, useState, type FormEvent } from 'react'

type PackageEntry = {
  id: string
  agencyName: string
  productTitle: string
  destination: string
  destinationCode: string
  price: number
  duration: string
  airline: string
  hotelName: string
  hotelGrade: number
  noShopping: boolean
  noOption: boolean
  noTip: boolean
  shoppingCount: number
  productUrl: string
  departureDates: string[]
  itinerary: string[]
  included: string[]
  excluded: string[]
  pros: string[]
  cons: string[]
  tags: string[]
  recommendation: string
  priceSignal: string
  summary: string
  childFriendly: string
  travelFatigue: string
  freeTime: string
  createdAt: string
  updatedAt: string
}

const DESTINATION_OPTIONS: { code: string; label: string }[] = [
  { code: 'DAD', label: '다낭' },
  { code: 'CXR', label: '나트랑' },
  { code: 'PQC', label: '푸꾸옥' },
  { code: 'HKG', label: '홍콩' },
  { code: 'TPE', label: '대만' },
  { code: 'BKK', label: '방콕' },
  { code: 'KIX', label: '오사카' },
  { code: 'NRT', label: '도쿄' },
  { code: 'HKT', label: '푸켓' },
  { code: 'CEB', label: '세부' },
]

const PRICE_SIGNALS = ['가격 좋음', '특가 감지', '프리미엄', '기다림']

const emptyForm = {
  agencyName: '',
  productTitle: '',
  destinationCode: 'DAD',
  destination: '다낭',
  price: 0,
  duration: '4박 5일',
  airline: '',
  hotelName: '',
  hotelGrade: 4,
  noShopping: false,
  noOption: false,
  noTip: false,
  shoppingCount: 0,
  productUrl: '',
  departureDates: '',
  itinerary: '',
  included: '',
  excluded: '',
  pros: '',
  cons: '',
  tags: '',
  recommendation: '',
  priceSignal: '가격 좋음',
  summary: '',
  childFriendly: '',
  travelFatigue: '',
  freeTime: '',
}

type FormState = typeof emptyForm

export function AdminPanel() {
  const [list, setList] = useState<PackageEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)

  const loadList = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/packages')
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      setList(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '목록 로드 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadList()
  }, [])

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onDestChange = (code: string) => {
    const found = DESTINATION_OPTIONS.find((d) => d.code === code)
    updateField('destinationCode', code)
    if (found) updateField('destination', found.label)
  }

  const startEdit = (pkg: PackageEntry) => {
    setEditingId(pkg.id)
    setForm({
      agencyName: pkg.agencyName,
      productTitle: pkg.productTitle,
      destinationCode: pkg.destinationCode,
      destination: pkg.destination,
      price: pkg.price,
      duration: pkg.duration,
      airline: pkg.airline,
      hotelName: pkg.hotelName,
      hotelGrade: pkg.hotelGrade,
      noShopping: pkg.noShopping,
      noOption: pkg.noOption,
      noTip: pkg.noTip,
      shoppingCount: pkg.shoppingCount,
      productUrl: pkg.productUrl,
      departureDates: pkg.departureDates.join(', '),
      itinerary: pkg.itinerary.join('\n'),
      included: pkg.included.join('\n'),
      excluded: pkg.excluded.join('\n'),
      pros: pkg.pros.join('\n'),
      cons: pkg.cons.join('\n'),
      tags: pkg.tags.join(', '),
      recommendation: pkg.recommendation,
      priceSignal: pkg.priceSignal,
      summary: pkg.summary,
      childFriendly: pkg.childFriendly,
      travelFatigue: pkg.travelFatigue,
      freeTime: pkg.freeTime,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setFlash(null)
    try {
      const url = editingId
        ? `/api/admin/packages/${editingId}`
        : '/api/admin/packages'
      const method = editingId ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) {
        const txt = await r.text()
        throw new Error(`HTTP ${r.status}: ${txt.slice(0, 120)}`)
      }
      await loadList()
      setForm(emptyForm)
      setEditingId(null)
      setFlash(editingId ? '수정 완료' : '등록 완료')
      setTimeout(() => setFlash(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('이 패키지를 삭제하시겠습니까?')) return
    try {
      const r = await fetch(`/api/admin/packages/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      await loadList()
      setFlash('삭제 완료')
      setTimeout(() => setFlash(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패')
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>힘찬트래블 관리자</h1>
        <p>패키지 상품 등록 · 수정 · 삭제</p>
        <a href="/" className="admin-header__home">
          ← 메인으로
        </a>
      </header>

      {flash ? <div className="admin-flash admin-flash--ok">{flash}</div> : null}
      {error ? (
        <div className="admin-flash admin-flash--error">{error}</div>
      ) : null}

      <section className="admin-section">
        <h2>{editingId ? '패키지 수정' : '새 패키지 등록'}</h2>
        <form className="admin-form" onSubmit={onSubmit}>
          <div className="admin-form__grid">
            <label>
              여행사명 *
              <input
                type="text"
                value={form.agencyName}
                onChange={(e) => updateField('agencyName', e.target.value)}
                required
              />
            </label>
            <label>
              상품명 *
              <input
                type="text"
                value={form.productTitle}
                onChange={(e) => updateField('productTitle', e.target.value)}
                required
              />
            </label>
            <label>
              도착지
              <select
                value={form.destinationCode}
                onChange={(e) => onDestChange(e.target.value)}
              >
                {DESTINATION_OPTIONS.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.label} ({o.code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              가격 (1인, 원)
              <input
                type="number"
                value={form.price}
                onChange={(e) => updateField('price', Number(e.target.value))}
                min={0}
              />
            </label>
            <label>
              기간
              <input
                type="text"
                value={form.duration}
                onChange={(e) => updateField('duration', e.target.value)}
                placeholder="4박 5일"
              />
            </label>
            <label>
              항공사
              <input
                type="text"
                value={form.airline}
                onChange={(e) => updateField('airline', e.target.value)}
                placeholder="대한항공, 아시아나, 베트남항공..."
              />
            </label>
            <label>
              호텔명
              <input
                type="text"
                value={form.hotelName}
                onChange={(e) => updateField('hotelName', e.target.value)}
              />
            </label>
            <label>
              호텔 등급
              <select
                value={form.hotelGrade}
                onChange={(e) =>
                  updateField('hotelGrade', Number(e.target.value))
                }
              >
                <option value={3}>3성급</option>
                <option value={4}>4성급</option>
                <option value={5}>5성급</option>
              </select>
            </label>
            <label>
              쇼핑 횟수
              <input
                type="number"
                value={form.shoppingCount}
                onChange={(e) =>
                  updateField('shoppingCount', Number(e.target.value))
                }
                min={0}
                max={10}
              />
            </label>
            <label>
              가격 시그널
              <select
                value={form.priceSignal}
                onChange={(e) => updateField('priceSignal', e.target.value)}
              >
                {PRICE_SIGNALS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-form__url">
              상품 URL
              <input
                type="url"
                value={form.productUrl}
                onChange={(e) => updateField('productUrl', e.target.value)}
                placeholder="https://..."
              />
            </label>
            <label className="admin-form__dates">
              출발 가능일 (쉼표 구분)
              <input
                type="text"
                value={form.departureDates}
                onChange={(e) => updateField('departureDates', e.target.value)}
                placeholder="5/12, 5/19, 5/26"
              />
            </label>
          </div>

          <fieldset className="admin-form__flags">
            <legend>옵션</legend>
            <label>
              <input
                type="checkbox"
                checked={form.noShopping}
                onChange={(e) => updateField('noShopping', e.target.checked)}
              />
              노쇼핑
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.noOption}
                onChange={(e) => updateField('noOption', e.target.checked)}
              />
              노옵션
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.noTip}
                onChange={(e) => updateField('noTip', e.target.checked)}
              />
              노팁
            </label>
          </fieldset>

          <label className="admin-form__textarea">
            추천 이유 (한 줄)
            <input
              type="text"
              value={form.recommendation}
              onChange={(e) => updateField('recommendation', e.target.value)}
            />
          </label>

          <label className="admin-form__textarea">
            태그 (쉼표 구분: 노쇼핑, 5성급 등)
            <input
              type="text"
              value={form.tags}
              onChange={(e) => updateField('tags', e.target.value)}
            />
          </label>

          <label className="admin-form__textarea">
            일정 (한 줄에 한 항목)
            <textarea
              rows={5}
              value={form.itinerary}
              onChange={(e) => updateField('itinerary', e.target.value)}
              placeholder={`1일차: 인천 → 다낭\n2일차: ...`}
            />
          </label>

          <div className="admin-form__pair">
            <label className="admin-form__textarea">
              포함사항 (한 줄에 한 항목)
              <textarea
                rows={4}
                value={form.included}
                onChange={(e) => updateField('included', e.target.value)}
              />
            </label>
            <label className="admin-form__textarea">
              불포함사항
              <textarea
                rows={4}
                value={form.excluded}
                onChange={(e) => updateField('excluded', e.target.value)}
              />
            </label>
          </div>

          <div className="admin-form__pair">
            <label className="admin-form__textarea">
              장점
              <textarea
                rows={3}
                value={form.pros}
                onChange={(e) => updateField('pros', e.target.value)}
              />
            </label>
            <label className="admin-form__textarea">
              단점
              <textarea
                rows={3}
                value={form.cons}
                onChange={(e) => updateField('cons', e.target.value)}
              />
            </label>
          </div>

          <label className="admin-form__textarea">
            총평
            <textarea
              rows={2}
              value={form.summary}
              onChange={(e) => updateField('summary', e.target.value)}
            />
          </label>

          <div className="admin-form__pair">
            <label className="admin-form__textarea">
              아이 동반
              <input
                type="text"
                value={form.childFriendly}
                onChange={(e) => updateField('childFriendly', e.target.value)}
              />
            </label>
            <label className="admin-form__textarea">
              이동 피로도
              <input
                type="text"
                value={form.travelFatigue}
                onChange={(e) => updateField('travelFatigue', e.target.value)}
              />
            </label>
          </div>

          <label className="admin-form__textarea">
            자유시간
            <input
              type="text"
              value={form.freeTime}
              onChange={(e) => updateField('freeTime', e.target.value)}
            />
          </label>

          <div className="admin-form__actions">
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={submitting}
            >
              {submitting ? '저장 중…' : editingId ? '수정 저장' : '등록'}
            </button>
            {editingId ? (
              <button
                type="button"
                className="admin-btn"
                onClick={cancelEdit}
              >
                취소
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="admin-section">
        <h2>등록된 패키지 ({list.length}개)</h2>
        {loading ? <p>로딩 중…</p> : null}
        {!loading && list.length === 0 ? (
          <p>아직 등록된 패키지가 없습니다.</p>
        ) : null}
        <ul className="admin-list">
          {list.map((p) => (
            <li key={p.id} className="admin-list__item">
              <div className="admin-list__head">
                <span className="admin-list__agency">{p.agencyName}</span>
                <span className="admin-list__dest">
                  {p.destination} ({p.destinationCode})
                </span>
              </div>
              <p className="admin-list__title">{p.productTitle}</p>
              <p className="admin-list__meta">
                {p.duration} · {p.price.toLocaleString('ko-KR')}원 ·{' '}
                {'★'.repeat(p.hotelGrade)} {p.hotelName} · {p.airline}
              </p>
              <div className="admin-list__actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--small"
                  onClick={() => startEdit(p)}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--small admin-btn--danger"
                  onClick={() => onDelete(p.id)}
                >
                  삭제
                </button>
                {p.productUrl ? (
                  <a
                    href={p.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn admin-btn--small"
                  >
                    원본 ↗
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
