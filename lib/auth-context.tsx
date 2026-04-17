'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '@/lib/api'

export interface User {
  id: number
  name: string
  email: string
  role: 'ngo' | 'volunteer'
  created_at: string
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
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }

    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const result = await authAPI.login(email, password)
      if (result.error) {
        return { success: false, error: result.error }
      }

      const data = result.data as any
      const newToken = data.access_token
      const newUser = data.user

      setToken(newToken)
      setUser(newUser)
      localStorage.setItem('auth_token', newToken)
      localStorage.setItem('auth_user', JSON.stringify(newUser))

      return { success: true, user: newUser }
    } catch (error) {
      return { success: false, error: 'Login failed' }
    }
  }

  const register = async (name: string, email: string, password: string, role: 'ngo' | 'volunteer') => {
    try {
      const result = await authAPI.register(name, email, password, role)
      if (result.error) {
        return { success: false, error: result.error }
      }

      // Auto-login after registration
      return login(email, password)
    } catch (error) {
      return { success: false, error: 'Registration failed' }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
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
