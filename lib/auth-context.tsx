'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '@/lib/api'

export interface User {
  id: number
  name: string
  email: string
  role: 'ngo' | 'volunteer' | 'admin'
  volunteer_id?: number | null   // FIX 1: critical for volunteer-side features (profile, portal, QR, analytics)
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>
  register: (name: string, email: string, password: string, role: 'ngo' | 'volunteer') => Promise<{ success: boolean; error?: string; user?: User }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('auth_token') || localStorage.getItem('token')
      const savedUser = localStorage.getItem('auth_user') || localStorage.getItem('user')

      if (savedToken && savedUser) {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      }
    } catch {
      // Corrupted localStorage — clear it
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // authAPI.login accepts { email, password } object
      const result = await authAPI.login({ email, password })

      // API returns { access_token, token_type, user: { id, name, email, role, volunteer_id } }
      const newToken: string = result.access_token
      const newUser: User = result.user   // volunteer_id is already in result.user from backend

      setToken(newToken)
      setUser(newUser)

      // Store under both key names for compatibility
      localStorage.setItem('auth_token', newToken)
      localStorage.setItem('token', newToken)
      localStorage.setItem('auth_user', JSON.stringify(newUser))
      localStorage.setItem('user', JSON.stringify(newUser))

      return { success: true, user: newUser }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message || 'Login failed' }
    }
  }

  const register = async (name: string, email: string, password: string, role: 'ngo' | 'volunteer') => {
    try {
      await authAPI.register({ name, email, password, role })
      // Auto-login after registration
      return login(email, password)
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message || 'Registration failed' }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
