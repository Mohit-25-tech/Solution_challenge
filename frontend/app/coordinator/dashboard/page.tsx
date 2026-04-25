'use client'

import { useEffect, useState, useRef } from 'react'
import { requestAPI, matchingAPI, dashboardAPI } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { NGOMatchDisplay } from '@/components/ngo-match-display'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface DashboardStats {
  total_volunteers: number
  active_requests: number
  completed_tasks: number
  completed_requests?: number
  total_assignments: number
  average_reliability: number
  pending_assignments: number
  active_assignments_now?: number
  volunteers_on_ground?: number
  pending_requests_count?: number
}

interface MatchCandidate {
  volunteer_id: number
  volunteer_name: string
  match_score: number
  reason: string
  distance_km: number
  breakdown?: any
}

// D5: Counter animation hook
function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0)
  const ref = useRef<number>(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const step = Math.max(1, Math.ceil(target / 20))
    const interval = duration / 20
    ref.current = 0
    const timer = setInterval(() => {
      ref.current = Math.min(ref.current + step, target)
      setValue(ref.current)
      if (ref.current >= target) clearInterval(timer)
    }, interval)
    return () => clearInterval(timer)
  }, [target])
  return value
}

const URGENCY_BORDER: Record<number, string> = {
  5: 'border-l-red-500',
  4: 'border-l-orange-500',
  3: 'border-l-yellow-500',
  2: 'border-l-blue-500',
  1: 'border-l-gray-300',
}

export default function CoordinatorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [matchCandidates, setMatchCandidates] = useState<MatchCandidate[]>([])
  const [matchLoading, setMatchLoading] = useState(false)
  const [assignmentStatus, setAssignmentStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // D1: Page entry animation
  useEffect(() => { setMounted(true) }, [])

  // B7: Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Load dashboard stats
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      try {
        const statsResult = await dashboardAPI.getStats(user.id)
        if (statsResult) setStats(statsResult as DashboardStats)
        const requestsResult = await requestAPI.getAll({ user_id: user.id, offset: 0, limit: 100 })
        if (requestsResult.items) setRequests((requestsResult.items as any[]) || [])
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // B7: Auto-refresh stats every 10s
  useEffect(() => {
    if (!user?.id) return
    const interval = setInterval(async () => {
      try {
        const statsResult = await dashboardAPI.getStats(user.id)
        if (statsResult) setStats(statsResult as DashboardStats)
      } catch {}
    }, 10000)
    return () => clearInterval(interval)
  }, [user?.id])

  // D5: Counter animations
  const animVolunteers = useCountUp(stats?.total_volunteers || 0)
  const animOnGround = useCountUp(stats?.volunteers_on_ground || 0)
  const animActive = useCountUp(stats?.active_requests || 0)
  const animPending = useCountUp(stats?.active_assignments_now || 0)
  const animCompleted = useCountUp(stats?.completed_requests || 0)

  const handleRequestSelect = async (request: any) => {
    setSelectedRequest(request)
    setMatchLoading(true)
    try {
      const result = await matchingAPI.getMatches(request.id, 10)
      if (result.candidates) setMatchCandidates(result.candidates)
    } catch {} finally { setMatchLoading(false) }
  }

  const handleAssignVolunteer = async (volunteerName: string) => {
    if (!selectedRequest) return
    try {
      const assignResult = await matchingAPI.assignBest(selectedRequest.id)
      if (assignResult.success) {
        setAssignmentStatus({ success: true, message: `✓ ${volunteerName} has been assigned!` })
        setTimeout(() => setAssignmentStatus(null), 3000)
      } else {
        setAssignmentStatus({ success: false, message: assignResult.message })
      }
    } catch (error: any) {
      setAssignmentStatus({ success: false, message: error.message || 'Failed to assign volunteer' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* C2: Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Command Center</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Welcome back, {user?.name} · {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {/* C4: Auto-reassign badge */}
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
          <span className="text-xs font-medium text-green-700">Smart Auto-assign: ON</span>
        </div>
      </div>
      <div className="h-px bg-gray-100" />

      {/* B7: Live Stats Banner */}
      {stats && (
        <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5, #6366f1)' }}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-white/60 font-medium mb-1">Total Volunteers</p>
              <p className="text-2xl font-bold">{animVolunteers}</p>
            </div>
            <div className="flex items-start gap-2">
              <div>
                <p className="text-xs text-white/60 font-medium mb-1">On Ground Now</p>
                <p className="text-2xl font-bold">{animOnGround}</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse-dot mt-1" />
            </div>
            <div>
              <p className="text-xs text-white/60 font-medium mb-1">Pending Assigns</p>
              <p className="text-2xl font-bold">{animPending}</p>
            </div>
            <div>
              <p className="text-xs text-white/60 font-medium mb-1">Open Requests</p>
              <p className="text-2xl font-bold">{animActive}</p>
            </div>
            <div>
              <p className="text-xs text-white/60 font-medium mb-1">Fulfilled</p>
              <p className="text-2xl font-bold">{animCompleted}</p>
            </div>
          </div>
        </div>
      )}

      {/* C4: Stat Cards with gradients */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: 'Volunteers', val: animVolunteers, emoji: '👥', gradient: 'from-blue-50 to-blue-100', border: 'border-l-blue-500', color: 'text-blue-700' },
            { label: 'On Ground', val: animOnGround, emoji: '🟢', gradient: 'from-green-50 to-green-100', border: 'border-l-green-500', color: 'text-green-700' },
            { label: 'Active Requests', val: animActive, emoji: '📋', gradient: 'from-amber-50 to-amber-100', border: 'border-l-amber-500', color: 'text-amber-700' },
            { label: 'Pending Assigns', val: animPending, emoji: '⏳', gradient: 'from-orange-50 to-orange-100', border: 'border-l-orange-500', color: 'text-orange-700' },
            { label: 'Completed', val: animCompleted, emoji: '✅', gradient: 'from-emerald-50 to-emerald-100', border: 'border-l-emerald-500', color: 'text-emerald-700' },
            { label: 'Avg Reliability', val: `${(stats.average_reliability * 100).toFixed(0)}%`, emoji: '📈', gradient: 'from-purple-50 to-purple-100', border: 'border-l-purple-500', color: 'text-purple-700' },
          ].map((c, i) => (
            <div key={c.label}
              className={`bg-gradient-to-br ${c.gradient} rounded-2xl p-4 border border-gray-100 border-l-4 ${c.border} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">{c.label}</p>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.val}</p>
                </div>
                <span className="text-xl">{c.emoji}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Requests List */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Requests</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {requests.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm font-medium text-gray-500">No requests created yet</p>
                <p className="text-xs text-gray-400 mt-1">Create your first request to get started</p>
              </div>
            ) : (
              requests.slice(0, 8).map((req: any, idx: number) => (
                <button
                  key={req.id}
                  className={`w-full text-left p-3 rounded-xl border-l-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm animate-fadeInUp ${
                    selectedRequest?.id === req.id
                      ? 'bg-blue-50 border-blue-500 border border-blue-200'
                      : `bg-white border border-gray-100 ${URGENCY_BORDER[req.urgency] || 'border-l-gray-300'}`
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  onClick={() => handleRequestSelect(req)}
                >
                  <p className={`font-medium text-sm ${req.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{req.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {req.type} · Urgency {req.urgency}/5 · <span className={req.status === 'completed' ? 'text-green-600' : req.status === 'pending' ? 'text-yellow-600' : 'text-blue-600'}>{req.status}</span>
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Matching Section */}
        <div className="space-y-4">
          {selectedRequest ? (
            <>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm animate-fadeInUp">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Request Details</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Title</p>
                    <p className="font-medium text-gray-900">{selectedRequest.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Description</p>
                    <p className="text-gray-600">{selectedRequest.description}</p>
                  </div>
                  <div className="flex gap-3">
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">{selectedRequest.type}</Badge>
                    <Badge className="bg-orange-50 text-orange-700 border-orange-200">Urgency {selectedRequest.urgency}/5</Badge>
                    <Badge className={`${selectedRequest.status === 'completed' ? 'bg-green-50 text-green-700' : selectedRequest.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
                      {selectedRequest.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {assignmentStatus && (
                <div className={`p-4 rounded-2xl border animate-fadeInUp ${assignmentStatus.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex gap-2 items-center">
                    {assignmentStatus.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <p className={`text-sm font-medium ${assignmentStatus.success ? 'text-green-800' : 'text-red-800'}`}>{assignmentStatus.message}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
              <p className="text-3xl mb-3">🎯</p>
              <p className="text-sm font-medium text-gray-500">Select a request to view matches</p>
              <p className="text-xs text-gray-400 mt-1">Click on any request from the list</p>
            </div>
          )}
        </div>
      </div>

      {/* Matching Candidates */}
      {selectedRequest && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Matching Volunteers</h2>
          <NGOMatchDisplay
            candidates={matchCandidates}
            onAssign={handleAssignVolunteer}
            isLoading={matchLoading}
          />
        </div>
      )}
    </div>
  )
}
