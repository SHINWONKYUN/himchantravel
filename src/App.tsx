import type { ReactNode } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { BottomNav } from './components/BottomNav'
import { Home } from './pages/Home'
import { BusinessDeals } from './pages/BusinessDeals'
import { Favorites } from './pages/Favorites'
import { MyTrips } from './pages/MyTrips'

function Shell() {
  const { activeTab, setActiveTab } = useApp()

  let body: ReactNode
  switch (activeTab) {
    case 'home':
      body = <Home />
      break
    case 'business':
      body = <BusinessDeals />
      break
    case 'favorites':
      body = <Favorites />
      break
    case 'myTrips':
      body = <MyTrips />
      break
    default:
      body = <Home />
  }

  return (
    <div className="app-shell">
      <main className="app-shell__main">{body}</main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <div className="app-frame">
        <Shell />
      </div>
    </AppProvider>
  )
}

export default App
