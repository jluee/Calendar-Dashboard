import { useEffect, useState } from 'react'
import './App.css'
import MemberCalendar from './components/MemberCalendar'

function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/dashboard-payload.json')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch (e) {
        setError(String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div style={{ padding: 24 }}>Loading calendar…</div>
  if (error) return <div style={{ padding: 24, color: 'crimson' }}>Failed to load: {error}</div>
  if (!data || data.length === 0) return <div style={{ padding: 24 }}>No data</div>

  return <div style={{ padding: 16 }}><MemberCalendar data={data} /></div>
}

export default App
