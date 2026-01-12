'use client'

import { useState, useEffect, useCallback } from 'react'

interface WeeklyTracking {
  id: number
  weekStart: string
  weekEnd: string
  xhsPostsTarget: number | null
  xhsPostsActual: number | null
  newFollowersTarget: number | null
  newFollowersActual: number | null
  inquiriesTarget: number | null
  inquiriesActual: number | null
  trialStudentsTarget: number | null
  trialStudentsActual: number | null
  newEnrollmentsTarget: number | null
  newEnrollmentsActual: number | null
  revenueTarget: number | null
  revenueActual: number | null
  wins: string | null
  challenges: string | null
  nextWeekPriorities: string | null
  onMainline: string | null
}

export function useWeeklyTracking() {
  const [data, setData] = useState<WeeklyTracking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrent = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/weekly?current=true')
      if (!res.ok) throw new Error('Failed to fetch')
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const update = useCallback(async (updates: Partial<WeeklyTracking>) => {
    if (!data) return
    try {
      const res = await fetch('/api/weekly', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.id, ...updates }),
      })
      if (!res.ok) throw new Error('Failed to update')
      const result = await res.json()
      setData(result)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }, [data])

  useEffect(() => {
    fetchCurrent()
  }, [fetchCurrent])

  return { data, loading, error, update, refresh: fetchCurrent }
}
