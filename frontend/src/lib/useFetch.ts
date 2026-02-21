import { useEffect, useState } from 'react'
import api from '@/lib/api'

export function useFetch<T>(path: string, initial: T) {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = () => {
    setLoading(true)
    api.get(path)
      .then((r) => setData(r.data))
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [path])

  return { data, loading, error, refresh }
}
