'use client'

import { useState, useCallback } from 'react'
import apiClient from '@/lib/api'
import { AxiosError, AxiosRequestConfig } from 'axios'

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

interface UseApiReturn<T> {
  data: T | null
  error: string | null
  loading: boolean
  execute: (config: AxiosRequestConfig) => Promise<T | null>
}

export function useApi<T = any>(options?: UseApiOptions): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const execute = useCallback(
    async (config: AxiosRequestConfig): Promise<T | null> => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiClient.request<T>(config)
        setData(response.data)
        
        if (options?.onSuccess) {
          options.onSuccess(response.data)
        }
        
        return response.data
      } catch (err) {
        const axiosError = err as AxiosError<{ detail?: string; message?: string }>
        const errorMessage = 
          axiosError.response?.data?.detail ||
          axiosError.response?.data?.message ||
          axiosError.message ||
          'An unexpected error occurred'
        
        setError(errorMessage)
        
        if (options?.onError) {
          options.onError(errorMessage)
        }
        
        return null
      } finally {
        setLoading(false)
      }
    },
    [options]
  )

  return { data, error, loading, execute }
}

// Convenience hooks for common HTTP methods
export function useGet<T = any>(url: string, options?: UseApiOptions) {
  const api = useApi<T>(options)
  
  const get = useCallback(
    (params?: any) => api.execute({ method: 'GET', url, params }),
    [api, url]
  )
  
  return { ...api, get }
}

export function usePost<T = any>(url: string, options?: UseApiOptions) {
  const api = useApi<T>(options)
  
  const post = useCallback(
    (data?: any) => api.execute({ method: 'POST', url, data }),
    [api, url]
  )
  
  return { ...api, post }
}

export function usePatch<T = any>(url: string, options?: UseApiOptions) {
  const api = useApi<T>(options)
  
  const patch = useCallback(
    (data?: any) => api.execute({ method: 'PATCH', url, data }),
    [api, url]
  )
  
  return { ...api, patch }
}

export function useDelete<T = any>(url: string, options?: UseApiOptions) {
  const api = useApi<T>(options)
  
  const del = useCallback(
    () => api.execute({ method: 'DELETE', url }),
    [api, url]
  )
  
  return { ...api, delete: del }
}


