import express from 'express'
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

const PACKAGES_FILE = path.join(__dirname, 'data', 'packages.json')

if (!RAPIDAPI_KEY) {
  console.error('[FATAL] RAPIDAPI_KEY env not set — refusing to start')
  process.exit(1)
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
    ts: new Date().toISOString(),
  })
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
