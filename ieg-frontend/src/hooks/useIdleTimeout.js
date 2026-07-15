import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../config/api'
import toast from 'react-hot-toast'

const IDLE_TIMEOUT = 30 * 60 * 1000 // 30 دقيقة

export default function useIdleTimeout() {
  const { isAuthenticated, logout } = useAuthStore()
  const navigate  = useNavigate()
  const timerRef  = useRef(null)

  const resetTimer = () => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try { await api.post('/auth/logout') } catch (_) {}
      logout()
      toast.error('Session expired due to inactivity. Please log in again.')
      navigate('/auth/login')
    }, IDLE_TIMEOUT)
  }

  useEffect(() => {
    if (!isAuthenticated) return

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetTimer))
    resetTimer()

    return () => {
      clearTimeout(timerRef.current)
      events.forEach(e => window.removeEventListener(e, resetTimer))
    }
  }, [isAuthenticated])
}