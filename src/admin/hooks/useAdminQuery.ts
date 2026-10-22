import { useEffect, useState } from 'react'
import { adminApi } from '../services/api'

export function useAdminQuery<T>(path: string, reloadKey = 0) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    adminApi.get<{ data: T }>(path)
      .then((response) => { if (active) { setData(response.data); setError('') } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load data.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [path, reloadKey])

  return { data, error, loading, setData }
}