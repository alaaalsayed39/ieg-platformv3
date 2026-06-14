import { useState, useEffect, useCallback } from 'react'
import api from '../config/api'
import toast from 'react-hot-toast'

export const useApi = (url, options = {}) => {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get(url, options)
      setData(res.data.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

export const useMutation = () => {
  const [loading, setLoading] = useState(false)

  const mutate = useCallback(async (fn, { successMsg, errorMsg } = {}) => {
    setLoading(true)
    try {
      const result = await fn()
      if (successMsg) toast.success(successMsg)
      return { data: result.data.data, success: true }
    } catch (err) {
      const msg = err.response?.data?.message || errorMsg || 'Something went wrong'
      toast.error(msg)
      return { error: msg, success: false }
    } finally {
      setLoading(false)
    }
  }, [])

  return { mutate, loading }
}
