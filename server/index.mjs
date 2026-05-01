import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT) || 3001
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST =
  process.env.RAPIDAPI_HOST || 'skyscanner-flights-travel-api.p.rapidapi.com'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const PACKAGES_FILE = path.join(__dirname, 'data', 'packages.json')

if (!RAPIDAPI_KEY) {
  console.error('[FATAL] RAPIDAPI_KEY env not set — refusing to start')
  process.exit(1)
}

const anthropic = ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  : null

if (!anthropic) {
  console.warn(
    '[WARN] ANTHROPIC_API_KEY not set — /api/packages/search will return 503',
  )
}

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 'loopback')
app.use(express.json({ limit: '256kb' }))

app.use((req, res, next) => {
  const ts = new Date().toISOString()
  console.log(`[${ts}] ${req.method} ${req.url}`)
  next()
})

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'himchantravel-api',
    upstream: RAPIDAPI_HOST,
    keyConfigured: Boolean(RAPIDAPI_KEY),
    anthropicConfigured: Boolean(ANTHROPIC_API_KEY),
    ts: new Date().toISOString(),
  })
})

const PACKAGE_SYSTEM_PROMPT = `당신은 한국 여행 패키지 검색 도우미입니다. 사용자가 요청한 조건에 맞는 여행사 패키지 상품을 web_search 도구로 검색해서 JSON 배열로 반환하세요.

각 상품은 아래 필드를 포함해야 합니다:
- agencyName(여행사명, string)
- productTitle(상품명, string)
- price(1인 가격, number)
- duration(예: "3박 5일", string)
- departureAirport("ICN" 또는 "GMP", string)
- departureDates(출발일 배열, string[])
- airline(항공사명, string)
- hotelName(호텔명, string)
- hotelGrade(3 | 4 | 5, number)
- noShopping(boolean)
- noOption(boolean)
- noTip(boolean)
- included(포함사항 배열, string[])
- excluded(불포함사항 배열, string[])
- pros(장점 배열, string[])
- cons(단점 배열, string[])
- productUrl(상품 링크 URL, string)
- summary(한줄 총평, string)

반드시 JSON 배열만 반환하세요. 설명 텍스트, 마크다운 코드블록 표기 없이 [ 로 시작해 ] 로 끝나야 합니다.
검색이 부족해도 추측하지 말고 실제로 web_search 결과에서 확인된 정보만 채우세요. 확인 안 되면 그 필드는 빈 문자열/빈 배열/0으로 두세요. 주요 여행사: 하나투어, 모두투어, 참좋은여행, 노랑풍선, 인터파크투어, 여기어때, 롯데관광.`

const packageCache = new Map()
const PACKAGE_TTL_MS = 10 * 60 * 1000

function extractJsonArray(text) {
  const trimmed = text.trim()
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  const candidate = fence ? fence[1].trim() : trimmed
  const start = candidate.indexOf('[')
  const end = candidate.lastIndexOf(']')
  if (start < 0 || end <= start) {
    throw new Error('JSON 배열 경계를 찾지 못했습니다')
  }
  return JSON.parse(candidate.slice(start, end + 1))
}

app.post('/api/packages/search', async (req, res) => {
  if (!anthropic) {
    return res.status(503).json({
      error: 'anthropic_not_configured',
      message:
        'ANTHROPIC_API_KEY가 server/.env에 설정되지 않았습니다. 사장님께 키를 받아 등록 후 PM2 reload 필요.',
    })
  }

  const body = req.body ?? {}
  const destination = typeof body.destination === 'string' ? body.destination.trim() : ''
  const month = typeof body.month === 'string' ? body.month.trim() : ''
  const adults = Number.isFinite(Number(body.adults)) ? Number(body.adults) : 2
  const preferences = Array.isArray(body.preferences) ? body.preferences.filter((p) => typeof p === 'string') : []

  if (!destination || !month) {
    return res.status(400).json({
      error: 'missing_params',
      required: ['destination', 'month'],
      received: { destination, month, adults, preferences },
    })
  }

  const cacheKey = JSON.stringify({
    destination,
    month,
    adults,
    preferences: [...preferences].sort(),
  })
  const cached = packageCache.get(cacheKey)
  if (cached && Date.now() - cached.ts < PACKAGE_TTL_MS) {
    return res.json({ ...cached.data, cached: true })
  }

  const userMessage = `${destination} ${month} 인천출발 패키지 여행 상품을 검색해주세요. 성인 ${adults}명. 선호조건: ${
    preferences.length ? preferences.join(', ') : '없음'
  }. 주요 여행사 상품 중 현재 판매 중인 것을 최대 10개 찾아주세요.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: [
        {
          type: 'text',
          text: PACKAGE_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: [
        {
          type: 'web_search_20260209',
          name: 'web_search',
          max_uses: 8,
        },
      ],
      messages: [{ role: 'user', content: userMessage }],
    })

    const textBlocks = response.content.filter((b) => b.type === 'text')
    if (textBlocks.length === 0) {
      throw new Error('응답에 text 블록이 없습니다')
    }
    const lastText = textBlocks[textBlocks.length - 1].text
    let items
    try {
      items = extractJsonArray(lastText)
    } catch (parseErr) {
      throw new Error(`JSON 파싱 실패: ${parseErr.message}. 원문 첫 200자: ${lastText.slice(0, 200)}`)
    }

    const payload = {
      total: items.length,
      items,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cacheRead: response.usage.cache_read_input_tokens ?? 0,
        cacheWrite: response.usage.cache_creation_input_tokens ?? 0,
        webSearchRequests: response.usage.server_tool_use?.web_search_requests ?? 0,
      },
      stopReason: response.stop_reason,
      cached: false,
    }
    packageCache.set(cacheKey, { ts: Date.now(), data: payload })
    res.json(payload)
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'rate_limited', message: err.message })
    }
    if (err instanceof Anthropic.APIError) {
      return res.status(502).json({
        error: 'anthropic_api_error',
        status: err.status,
        message: err.message,
      })
    }
    res.status(500).json({
      error: 'package_search_failed',
      message: err?.message ?? String(err),
    })
  }
})

async function readPackages() {
  try {
    const raw = await fs.readFile(PACKAGES_FILE, 'utf8')
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

async function writePackages(arr) {
  const tmp = `${PACKAGES_FILE}.tmp`
  const json = JSON.stringify(arr, null, 2)
  await fs.writeFile(tmp, json, 'utf8')
  await fs.rename(tmp, PACKAGES_FILE)
}

function sanitizeString(v, max = 200) {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

function sanitizeNumber(v, fallback = 0) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}

function sanitizeBool(v) {
  return v === true || v === 'true' || v === 1 || v === '1'
}

function sanitizeStringArray(v, maxItems = 30, maxLen = 200) {
  if (Array.isArray(v)) {
    return v
      .map((x) => sanitizeString(String(x), maxLen))
      .filter((x) => x.length > 0)
      .slice(0, maxItems)
  }
  if (typeof v === 'string') {
    return v
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, maxItems)
  }
  return []
}

function makePackageEntry(input, existing) {
  const id =
    sanitizeString(existing?.id, 64) ||
    `pkg-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`

  const agencyName = sanitizeString(input.agencyName, 60)
  const productTitle = sanitizeString(input.productTitle, 200)
  const destinationCode = sanitizeString(input.destinationCode, 10).toUpperCase()
  const destination = sanitizeString(input.destination, 60)
  const price = sanitizeNumber(input.price)
  const duration = sanitizeString(input.duration, 30)
  const airline = sanitizeString(input.airline, 60)
  const seatClass = sanitizeString(input.seatClass, 30) || '일반석'
  const hotelName = sanitizeString(input.hotelName, 100)
  const hotelGrade = Math.max(0, Math.min(5, sanitizeNumber(input.hotelGrade)))
  const noShopping = sanitizeBool(input.noShopping)
  const noOption = sanitizeBool(input.noOption)
  const noTip = sanitizeBool(input.noTip)
  const productUrl = sanitizeString(input.productUrl, 500)
  const departureDates = sanitizeStringArray(input.departureDates, 50, 20)
  const itinerary = sanitizeStringArray(input.itinerary, 20, 300)
  const included = sanitizeStringArray(input.included, 20, 200)
  const excluded = sanitizeStringArray(input.excluded, 20, 200)
  const pros = sanitizeStringArray(input.pros, 10, 200)
  const cons = sanitizeStringArray(input.cons, 10, 200)
  const tags = sanitizeStringArray(input.tags, 10, 30)
  const recommendation = sanitizeString(input.recommendation, 300)
  const summary = sanitizeString(input.summary, 500)
  const childFriendly = sanitizeString(input.childFriendly, 200)
  const travelFatigue = sanitizeString(input.travelFatigue, 200)
  const freeTime = sanitizeString(input.freeTime, 200)
  const shoppingCount = sanitizeNumber(input.shoppingCount)
  const priceSignal =
    sanitizeString(input.priceSignal, 30) || '가격 좋음'

  return {
    id,
    agencyName,
    productTitle,
    destination,
    destinationCode,
    destinationKey: destination || destinationCode.toLowerCase(),
    departureArea: '서울/인천',
    departureAirport: 'ICN',
    price,
    duration,
    tripType: '패키지',
    airline,
    seatClass,
    hotelName,
    hotelGrade,
    noShopping,
    noOption,
    noTip,
    shoppingCount,
    productUrl,
    departureDates,
    itinerary,
    included,
    excluded,
    pros,
    cons,
    tags,
    recommendation,
    priceSignal,
    summary,
    childFriendly,
    travelFatigue,
    freeTime,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

app.get('/api/packages', async (req, res) => {
  const list = await readPackages()
  const dest = sanitizeString(String(req.query.dest ?? ''), 10).toUpperCase()
  const filtered = dest
    ? list.filter((p) => p.destinationCode === dest)
    : list
  res.json({ total: filtered.length, items: filtered })
})

app.post('/api/admin/packages', async (req, res) => {
  const body = req.body ?? {}
  if (!body.agencyName || !body.productTitle) {
    return res.status(400).json({
      error: 'missing_required',
      required: ['agencyName', 'productTitle'],
    })
  }
  const entry = makePackageEntry(body)
  const list = await readPackages()
  list.push(entry)
  await writePackages(list)
  res.status(201).json(entry)
})

app.put('/api/admin/packages/:id', async (req, res) => {
  const id = req.params.id
  const list = await readPackages()
  const idx = list.findIndex((p) => p.id === id)
  if (idx < 0) return res.status(404).json({ error: 'not_found', id })
  const updated = makePackageEntry(req.body ?? {}, list[idx])
  list[idx] = updated
  await writePackages(list)
  res.json(updated)
})

app.delete('/api/admin/packages/:id', async (req, res) => {
  const id = req.params.id
  const list = await readPackages()
  const next = list.filter((p) => p.id !== id)
  if (next.length === list.length) {
    return res.status(404).json({ error: 'not_found', id })
  }
  await writePackages(next)
  res.json({ ok: true, deletedId: id })
})

const airportCache = new Map()

async function lookupAirport(skyId, signal) {
  const key = String(skyId).toUpperCase()
  if (airportCache.has(key)) return airportCache.get(key)

  const url = new URL(`https://${RAPIDAPI_HOST}/flights/searchAirport`)
  url.searchParams.set('query', key)

  const r = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
      Accept: 'application/json',
    },
    signal,
  })
  if (!r.ok) return null
  const j = await r.json().catch(() => null)
  const places = (j && Array.isArray(j.places) ? j.places : []) || []
  const exact = places.find((p) => String(p.skyId).toUpperCase() === key)
  const result = exact ?? places[0] ?? null
  if (result) airportCache.set(key, result)
  return result
}

app.get('/api/flights', async (req, res) => {
  const { origin, dest, date, adults = '1' } = req.query

  if (!origin || !dest || !date) {
    return res.status(400).json({
      error: 'missing_params',
      required: ['origin', 'dest', 'date'],
      optional: ['adults'],
      received: req.query,
    })
  }

  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), 25_000)

  try {
    const [originPlace, destPlace] = await Promise.all([
      lookupAirport(String(origin), ac.signal),
      lookupAirport(String(dest), ac.signal),
    ])

    if (!originPlace?.entityId || !destPlace?.entityId) {
      return res.status(400).json({
        error: 'airport_lookup_failed',
        origin: originPlace ?? null,
        dest: destPlace ?? null,
        hint: 'skyId가 정확한지 확인하세요. (예: ICN, GMP, DAD, HKG, TPE)',
      })
    }

    const target = new URL(`https://${RAPIDAPI_HOST}/flights/searchFlights`)
    target.searchParams.set('originSkyId', String(originPlace.skyId))
    target.searchParams.set('destinationSkyId', String(destPlace.skyId))
    target.searchParams.set('originEntityId', String(originPlace.entityId))
    target.searchParams.set('destinationEntityId', String(destPlace.entityId))
    target.searchParams.set('date', String(date))
    target.searchParams.set('adults', String(adults))
    target.searchParams.set('currency', 'KRW')
    target.searchParams.set('market', 'ko-KR')
    target.searchParams.set('countryCode', 'KR')

    const upstream = await fetch(target, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        Accept: 'application/json',
      },
      signal: ac.signal,
    })
    const text = await upstream.text()
    res.status(upstream.status)
    const ct = upstream.headers.get('content-type')
    if (ct) res.set('Content-Type', ct)
    res.send(text)
  } catch (err) {
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : String(err)
    res.status(502).json({
      error: 'upstream_fetch_failed',
      message,
    })
  } finally {
    clearTimeout(timer)
  }
})

app.get('/api/skyscanner/*', async (req, res) => {
  const upstreamPath = req.path.replace(/^\/api\/skyscanner/, '')
  const url = new URL(req.originalUrl, 'http://localhost')
  const target = `https://${RAPIDAPI_HOST}${upstreamPath}${url.search}`

  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), 25_000)

  try {
    const upstream = await fetch(target, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        Accept: 'application/json',
      },
      signal: ac.signal,
    })
    const text = await upstream.text()
    res.status(upstream.status)
    const ct = upstream.headers.get('content-type')
    if (ct) res.set('Content-Type', ct)
    res.send(text)
  } catch (err) {
    const message = err && typeof err === 'object' && 'message' in err
      ? String(err.message)
      : String(err)
    res.status(502).json({
      error: 'upstream_fetch_failed',
      message,
      target: `${upstreamPath}${url.search}`,
    })
  } finally {
    clearTimeout(timer)
  }
})

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'not_found', path: req.path })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(
    `[himchantravel-api] listening on 127.0.0.1:${PORT}, upstream=${RAPIDAPI_HOST}`,
  )
})
