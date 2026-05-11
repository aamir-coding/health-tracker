import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export function useSocket({ onLogNew, onLogUpdated, onLogDeleted } = {}) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const callbacksRef = useRef({ onLogNew, onLogUpdated, onLogDeleted })

  // Keep callbacks ref up to date without re-creating the socket
  useEffect(() => {
    callbacksRef.current = { onLogNew, onLogUpdated, onLogDeleted }
  })

  useEffect(() => {
    if (!user?.id) return

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join', user.id)
    })

    socket.on('log:new', (data) => callbacksRef.current.onLogNew?.(data))
    socket.on('log:updated', (data) => callbacksRef.current.onLogUpdated?.(data))
    socket.on('log:deleted', (data) => callbacksRef.current.onLogDeleted?.(data))

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user?.id])
}