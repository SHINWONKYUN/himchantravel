import { MY_TRIP_DESTINATIONS } from '../data/mockTrips'
import { useApp } from '../context/AppContext'

export function MyTrips() {
  const { visitedKeys, toggleVisited } = useApp()

  return (
    <div className="page my-trips-page">
      <header className="page-header">
        <h1 className="page-header__title">내 여행</h1>
        <p className="page-header__sub">
          다녀온 여행지를 체크하면 안 가본 곳을 우선 추천해요
        </p>
      </header>

      <ul className="destination-grid">
        {MY_TRIP_DESTINATIONS.map((name) => {
          const done = visitedKeys.has(name)
          return (
            <li key={name}>
              <button
                type="button"
                className={`dest-chip${done ? ' dest-chip--done' : ''}`}
                onClick={() => toggleVisited(name)}
                aria-pressed={done}
              >
                <span className="dest-chip__name">{name}</span>
                <span className="dest-chip__status">
                  {done ? '다녀온 곳' : '안 가본 곳'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
