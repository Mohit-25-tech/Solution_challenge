/**
 * API Service Layer
 * Centralized API calls for all backend endpoints
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      return {
        error: error?.detail || error?.message || 'An error occurred',
      }
    }

    const data = await response.json()
    return { data }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Auth endpoints
 */
export const authAPI = {
  register: async (name: string, email: string, password: string, role: 'ngo' | 'volunteer') => {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    })
  },

  login: async (email: string, password: string) => {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
}

/**
 * Volunteer endpoints
 */
export const volunteerAPI = {
  getRecommended: async (volunteerId: number) => {
    return apiFetch(`/volunteer/recommended?volunteer_id=${volunteerId}`)
  },

  getNearby: async (volunteerId: number, latitude: number, longitude: number, limit = 10) => {
    return apiFetch(
      `/volunteer/nearby?volunteer_id=${volunteerId}&latitude=${latitude}&longitude=${longitude}&limit=${limit}`
    )
  },

  getMyTasks: async (volunteerId: number, statusFilter?: string) => {
    const query = statusFilter ? `?volunteer_id=${volunteerId}&status_filter=${statusFilter}` : `?volunteer_id=${volunteerId}`
    return apiFetch(`/volunteer/tasks${query}`)
  },

  getAll: async (skip = 0, limit = 100) => {
    return apiFetch(`/volunteers?skip=${skip}&limit=${limit}`)
  },

  getById: async (volunteerId: number) => {
    return apiFetch(`/volunteers/${volunteerId}`)
  },

  update: async (volunteerId: number, data: any) => {
    return apiFetch(`/volunteers/${volunteerId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
}

/**
 * Request endpoints
 */
export const requestAPI = {
  create: async (userId: number, data: any) => {
    return apiFetch(`/requests?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAll: async (skip = 0, limit = 100, statusFilter?: string) => {
    let query = `?skip=${skip}&limit=${limit}`
    if (statusFilter) query += `&status_filter=${statusFilter}`
    return apiFetch(`/requests${query}`)
  },

  getById: async (requestId: number) => {
    return apiFetch(`/requests/${requestId}`)
  },

  update: async (requestId: number, data: any) => {
    return apiFetch(`/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
}

/**
 * Matching endpoints
 */
export const matchingAPI = {
  getMatches: async (requestId: number, limit = 10) => {
    return apiFetch(`/match/${requestId}?limit=${limit}`, {
      method: 'POST',
    })
  },

  autoAssign: async (requestId: number) => {
    return apiFetch(`/match/assign/${requestId}`, {
      method: 'POST',
    })
  },
}

/**
 * Assignment endpoints
 */
export const assignmentAPI = {
  accept: async (assignmentId: number) => {
    return apiFetch(`/assignments/${assignmentId}/accept`, {
      method: 'POST',
    })
  },

  reject: async (assignmentId: number) => {
    return apiFetch(`/assignments/${assignmentId}/reject`, {
      method: 'POST',
    })
  },

  complete: async (assignmentId: number) => {
    return apiFetch(`/assignments/${assignmentId}/complete`, {
      method: 'POST',
    })
  },

  getAll: async (skip = 0, limit = 100, statusFilter?: string) => {
    let query = `?skip=${skip}&limit=${limit}`
    if (statusFilter) query += `&status_filter=${statusFilter}`
    return apiFetch(`/assignments${query}`)
  },

  getById: async (assignmentId: number) => {
    return apiFetch(`/assignments/${assignmentId}`)
  },
}

/**
 * Dashboard endpoints
 */
export const dashboardAPI = {
  getStats: async () => {
    return apiFetch('/dashboard/stats')
  },

  getHeatmap: async () => {
    return apiFetch('/dashboard/heatmap')
  },
}
