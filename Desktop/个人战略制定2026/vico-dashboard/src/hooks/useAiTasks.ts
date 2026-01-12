'use client'

import { useState, useEffect, useCallback } from 'react'

interface AiTask {
  id: number
  taskName: string
  description: string | null
  toolSuggestion: string | null
  priority: number | null
  status: string | null
  notes: string | null
}

export function useAiTasks() {
  const [data, setData] = useState<AiTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/ai-tasks')
      if (!res.ok) throw new Error('Failed to fetch')
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTask = useCallback(async (id: number, updates: Partial<AiTask>) => {
    try {
      const res = await fetch('/api/ai-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (!res.ok) throw new Error('Failed to update')
      const result = await res.json()
      setData(prev => prev.map(t => t.id === result.id ? result : t))
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }, [])

  const createTask = useCallback(async (taskData?: Partial<AiTask>) => {
    try {
      const res = await fetch('/api/ai-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData || {}),
      })
      if (!res.ok) throw new Error('Failed to create')
      const result = await res.json()
      setData(prev => [...prev, result])
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }, [])

  const deleteTask = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/ai-tasks?id=${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      setData(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return { data, loading, error, updateTask, createTask, deleteTask, refresh: fetchTasks }
}
