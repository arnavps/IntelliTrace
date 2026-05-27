import { useState, useEffect, useCallback } from 'react'

const API_BASE = 'http://localhost:8000'

export function useApi<T>(url: string, dependencies: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}${url}`)
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
      const json = await res.json()
      setData(json)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...dependencies])

  return { data, loading, error, refetch: fetchData }
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export function getUser() {
  try {
    const s = localStorage.getItem('user')
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}
