const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

async function apiFetch(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }))
    throw new Error(err.detail || "Request failed")
  }

  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: {
    name: string
    email: string
    password: string
    role: string
  }) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify(data) }),
}

// ── Volunteers ────────────────────────────────────────────────────
export const volunteerAPI = {
  create: (userId: number, data: object) =>
    apiFetch(`/volunteers?user_id=${userId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: (params?: {
    is_available?: boolean
    skill?: string
    limit?: number
    offset?: number
  }) => {
    const q = new URLSearchParams()
    if (params?.is_available !== undefined)
      q.set("is_available", String(params.is_available))
    if (params?.skill) q.set("skill", params.skill)
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.offset) q.set("offset", String(params.offset))
    return apiFetch(`/volunteers?${q}`)
  },

  getById: (id: number) => apiFetch(`/volunteers/${id}`),

  update: (id: number, data: object) =>
    apiFetch(`/volunteers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  toggleAvailability: (id: number, isAvailable: boolean) =>
    apiFetch(`/volunteers/${id}/availability`, {
      method: "PATCH",
      body: JSON.stringify({ is_available: isAvailable }),
    }),

  getHistory: (id: number) => apiFetch(`/volunteers/${id}/history`),

  getLeaderboard: () => apiFetch(`/volunteers/leaderboard`),
}

// ── Requests ──────────────────────────────────────────────────────
export const requestAPI = {
  create: (userId: number, data: object) =>
    apiFetch(`/requests?user_id=${userId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: (params?: {
    user_id?: number
    status?: string
    type?: string
    urgency?: number
    limit?: number
    offset?: number
  }) => {
    const q = new URLSearchParams()
    if (params?.user_id) q.set("user_id", String(params.user_id))
    if (params?.status) q.set("status", params.status)
    if (params?.type) q.set("type", params.type)
    if (params?.urgency) q.set("urgency", String(params.urgency))
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.offset) q.set("offset", String(params.offset))
    return apiFetch(`/requests?${q}`)
  },

  getById: (id: number) => apiFetch(`/requests/${id}`),

  update: (id: number, data: object) =>
    apiFetch(`/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: number, status: string) =>
    apiFetch(`/requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  cancel: (id: number) =>
    apiFetch(`/requests/${id}`, { method: "DELETE" }),
}

// ── Assignments ───────────────────────────────────────────────────
export const assignmentAPI = {
  getById: (id: number) => apiFetch(`/assignments/${id}`),

  accept: (id: number) =>
    apiFetch(`/assignments/${id}/accept`, { method: "POST" }),

  reject: (id: number) =>
    apiFetch(`/assignments/${id}/reject`, { method: "POST" }),

  complete: (id: number) =>
    apiFetch(`/assignments/${id}/complete`, { method: "POST" }),

  getQRData: (id: number) => apiFetch(`/assignments/${id}/qr-data`),

  verifyQR: (token: string) =>
    apiFetch(`/assignments/verify-qr`, {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
}

// ── Matching ──────────────────────────────────────────────────────
export const matchingAPI = {
  getMatches: (requestId: number, limit = 5) =>
    apiFetch(`/match/${requestId}?limit=${limit}`, { method: "POST" }),

  assignBest: (requestId: number) =>
    apiFetch(`/match/assign/${requestId}`, { method: "POST" }),

  manualAssign: (requestId: number, volunteerId: number, matchScore: number = 1.0) =>
    apiFetch(`/match/assign/${requestId}/${volunteerId}?match_score=${matchScore}`, { method: "POST" }),
}

// ── Dashboard ─────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: (userId?: number) => apiFetch(`/dashboard/stats${userId ? `?user_id=${userId}` : ""}`),
  getHeatmap: () => apiFetch(`/dashboard/heatmap`),
}

// ── Analytics ─────────────────────────────────────────────────────
export const analyticsAPI = {
  getOverview: () => apiFetch(`/analytics/overview`),
  getVolunteerStats: (volunteerId: number) =>
    apiFetch(`/analytics/volunteer/${volunteerId}`),
}

// ── Notifications ─────────────────────────────────────────────────
export const notificationAPI = {
  getAll: (userId: number, limit = 20) =>
    apiFetch(`/notifications?user_id=${userId}&limit=${limit}`),

  markRead: (id: number) =>
    apiFetch(`/notifications/${id}/read`, { method: "POST" }),

  markAllRead: (userId: number) =>
    apiFetch(`/notifications/read-all?user_id=${userId}`, { method: "POST" }),
}

// ── Volunteer Portal ──────────────────────────────────────────────
export const volunteerPortalAPI = {
  getRecommended: (volunteerId: number) =>
    apiFetch(`/volunteer/recommended?volunteer_id=${volunteerId}`),

  getNearby: (
    volunteerId: number,
    lat: number,
    lng: number,
    limit = 10
  ) =>
    apiFetch(
      `/volunteer/nearby?volunteer_id=${volunteerId}&latitude=${lat}&longitude=${lng}&limit=${limit}`
    ),

  getTasks: (volunteerId: number, statusFilter?: string) =>
    apiFetch(
      `/volunteer/tasks?volunteer_id=${volunteerId}${statusFilter ? `&status_filter=${statusFilter}` : ""}`
    ),
}

// ── External ──────────────────────────────────────────────────────
export const externalAPI = {
  getNDMAAlerts: () => apiFetch(`/external/ndma-alerts`),
  getWeather: (lat: number, lng: number) =>
    apiFetch(`/external/weather?lat=${lat}&lng=${lng}`),
}
