import { useState, useEffect, useCallback } from 'react'

const store = new Map()

export function readPageCache(key) {
  return store.get(key)
}

export function writePageCache(key, value) {
  store.set(key, value)
}

export function clearPageCache() {
  store.clear()
}

export function usePageCache(key, loader) {
  const [data, setData] = useState(() => readPageCache(key))
  const [loading, setLoading] = useState(() => readPageCache(key) === undefined)

  useEffect(() => {
    const cached = readPageCache(key)
    if (cached !== undefined) {
      setData(cached)
      setLoading(false)
    } else {
      setData(undefined)
      setLoading(true)
    }
  }, [key])

  const refresh = useCallback(async ({ silent = false } = {}) => {
    const hasCache = readPageCache(key) !== undefined
    if (!silent && !hasCache) setLoading(true)
    try {
      const result = await loader()
      writePageCache(key, result)
      setData(result)
      return result
    } finally {
      setLoading(false)
    }
  }, [key, loader])

  useEffect(() => {
    refresh({ silent: readPageCache(key) !== undefined })
  }, [refresh])

  return { data, loading, refresh, setData }
}
