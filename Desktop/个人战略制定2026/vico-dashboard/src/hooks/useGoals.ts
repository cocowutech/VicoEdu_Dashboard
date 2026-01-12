'use client'

import { useState, useEffect, useCallback } from 'react'

interface Goal {
  id: number
  goalType: string | null
  goalName: string
  targetValue: number | null
  currentValue: number | null
  unit: string | null
  deadline: string | null
  period: string | null
  status: string | null
}

export function useGoals() {
  const [data, setData] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/goals')
      if (!res.ok) throw new Error('Failed to fetch')
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateGoal = useCallback(async (goal: Partial<Goal> & { id: number }) => {
    try {
      const res = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      })
      if (!res.ok) throw new Error('Failed to update')
      const result = await res.json()
      setData(prev => prev.map(g => g.id === result.id ? result : g))
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }, [])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  return { data, loading, error, updateGoal, refresh: fetchGoals }
}
