import type { HomeFilterId } from '../types/trip'

const FILTERS: { id: HomeFilterId; label: string }[] = [
  { id: 'unvisited', label: '안 가본 곳' },
  { id: 'noShopping', label: '노쇼핑' },
  { id: 'noOption', label: '노옵션' },
  { id: 'business', label: '비즈니스 특가' },
  { id: 'may', label: '5월 출발' },
]

type Props = {
  active: Set<HomeFilterId>
  onToggle: (id: HomeFilterId) => void
}

export function FilterChips({ active, onToggle }: Props) {
  return (
    <div className="filter-chips" role="group" aria-label="추천 필터">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          className={`filter-chips__chip${active.has(f.id) ? ' filter-chips__chip--on' : ''}`}
          onClick={() => onToggle(f.id)}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
