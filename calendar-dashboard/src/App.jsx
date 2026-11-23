import { useEffect, useState, useRef } from 'react'
import './App.css'
import MemberCalendar from './components/MemberCalendar'
import {
  extendDatasetIfNeeded,
  getLastMeetingEnd
} from './utils/generateMeetings'

const STORAGE_KEY = 'calendar-dashboard-meetings-v2'

function loadPersistedDataset() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function persistDataset(dataset) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset))
  } catch {
    // Quota or private mode — keep in-memory only
  }
}

function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const dataRef = useRef(null)

  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    let cancelled = false
    let intervalId

    const applyExtension = (dataset) => {
      const { data: next, extended } = extendDatasetIfNeeded(dataset)
      if (extended) persistDataset(next)
      return next
    }

    const load = async () => {
      try {
        const persisted = loadPersistedDataset()
        if (persisted?.length) {
          if (cancelled) return
          const next = applyExtension(persisted)
          setData(next)
          setLoading(false)
        } else {
          const res = await fetch('/data-payload.update.json')
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const json = await res.json()
          if (cancelled) return
          const next = applyExtension(json)
          persistDataset(next)
          setData(next)
          setLoading(false)
        }

        // Poll so we extend as soon as the last meeting occurs
        intervalId = setInterval(() => {
          const current = dataRef.current
          if (!current?.length) return

          const lastEnd = getLastMeetingEnd(current)
          if (!lastEnd || Date.now() < lastEnd.getTime()) return

          const { data: next, extended } = extendDatasetIfNeeded(current)
          if (extended) {
            persistDataset(next)
            setData(next)
          }
        }, 30_000)
      } catch (e) {
        if (!cancelled) {
          setError(String(e))
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  if (loading) return <div style={{ padding: 24 }}>Loading calendar…</div>
  if (error) return <div style={{ padding: 24, color: 'crimson' }}>Failed to load: {error}</div>
  if (!data || data.length === 0) return <div style={{ padding: 24 }}>No data</div>

  return <div style={{ padding: 16 }}><MemberCalendar data={data} /></div>
}

export default App
