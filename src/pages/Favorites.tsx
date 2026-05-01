import { TravelCard } from '../components/TravelCard'
import { MOCK_TRIPS } from '../data/mockTrips'
import { useApp } from '../context/AppContext'

function EmptyIllustration() {
  return (
    <div className="favorites-empty__art" aria-hidden>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" stroke="#e5e7eb" strokeWidth="1.25" />
        <circle cx="32" cy="32" r="24" fill="#f9fafb" />
        <path
          d="M32 40.5l-1.35-1.2c-5.4-4.9-8.8-8.2-8.8-11.9 0-2.4 1.8-4.3 4.2-4.3 1.9 0 3.8 1.2 4.6 2.9h.7c.8-1.7 2.6-2.9 4.6-2.9 2.4 0 4.2 1.9 4.2 4.3 0 3.7-3.4 7-8.8 11.9L32 40.5z"
          stroke="#9ca3af"
          strokeWidth="1.35"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export function Favorites() {
  const { visitedKeys, favoriteIds, toggleFavorite, openTripDetail } = useApp()
  const saved = MOCK_TRIPS.filter((t) => favoriteIds.has(t.id))

  return (
    <div className="page favorites-page">
      <header className="page-header">
        <h1 className="page-header__title">관심 여행</h1>
        <p className="page-header__sub">저장한 찬스만 모아둔 목록이에요</p>
      </header>

      <div className="notice-card" role="note">
        가격 알림은 추후 연결 예정이에요.
      </div>

      <section className="card-list" aria-label="관심 저장 목록">
        {saved.length === 0 ? (
          <div className="favorites-empty">
            <EmptyIllustration />
            <p className="favorites-empty__title">아직 저장한 여행지가 없어요</p>
            <p className="favorites-empty__sub">
              마음에 드는 여행 찬스를 저장해보세요
            </p>
          </div>
        ) : (
          saved.map((trip) => (
            <TravelCard
              key={trip.id}
              trip={trip}
              unvisited={!visitedKeys.has(trip.destinationKey)}
              saved
              onToggleSave={() => toggleFavorite(trip.id)}
              onSelect={() => openTripDetail(trip.id, null)}
            />
          ))
        )}
      </section>
    </div>
  )
}
