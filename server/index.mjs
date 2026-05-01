import express from 'express'

const PORT = Number(process.env.PORT) || 3001
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST =
  process.env.RAPIDAPI_HOST || 'skyscanner-flights-travel-api.p.rapidapi.com'

if (!RAPIDAPI_KEY) {
  console.error('[FATAL] RAPIDAPI_KEY env not set — refusing to start')
  process.exit(1)
}

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 'loopback')

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

  const target = new URL(`https://${RAPIDAPI_HOST}/flights/searchFlights`)
  target.searchParams.set('originSkyId', String(origin))
  target.searchParams.set('destinationSkyId', String(dest))
  target.searchParams.set('date', String(date))
  target.searchParams.set('adults', String(adults))
  target.searchParams.set('currency', 'KRW')
  target.searchParams.set('market', 'ko-KR')
  target.searchParams.set('countryCode', 'KR')

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
