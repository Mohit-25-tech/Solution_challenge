"use client"
import { useEffect, useState, useCallback } from "react"
import { requestAPI, matchingAPI, externalAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { PageSkeleton, ErrorState } from "@/components/page-skeleton"
import { DeadlineBadge } from "@/components/deadline-badge"
import dynamic from "next/dynamic"

const MapPinPicker = dynamic(
  () => import("@/components/map-pin-picker").then(m => ({ default: m.MapPinPicker })),
  { ssr: false, loading: () => <div className="h-[200px] shimmer-gradient rounded-xl" /> }
)

const REQUEST_TYPES = ["all", "medical", "food", "rescue", "construction", "logistics", "counseling"]
const STATUS_TABS = ["all", "pending", "assigned", "completed", "cancelled"]

const URGENCY_COLORS: Record<number, string> = {
  5: "bg-red-100 text-red-700 border-red-200",
  4: "bg-orange-100 text-orange-700 border-orange-200",
  3: "bg-yellow-100 text-yellow-700 border-yellow-200",
  2: "bg-blue-100 text-blue-700 border-blue-200",
  1: "bg-gray-100 text-gray-500 border-gray-200",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  assigned: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-400",
}

const URGENCY_BORDERS: Record<number, string> = {
  5: "border-l-red-500",
  4: "border-l-orange-500",
  3: "border-l-yellow-500",
  2: "border-l-blue-500",
  1: "border-l-gray-300",
}

type Request = {
  id: number; type: string; title: string; description: string;
  urgency: number; status: string; volunteers_needed: number;
  fulfilled_count: number; deadline?: string; source: string; tags: string[]
}

const LIMIT = 20

export default function CoordinatorRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<Request[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [urgencyFilter, setUrgencyFilter] = useState<number | undefined>()
  const [page, setPage] = useState(0)
  const [assigning, setAssigning] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  const [showMatchModal, setShowMatchModal] = useState(false)
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null)
  const [matchCandidates, setMatchCandidates] = useState<any[]>([])
  const [loadingMatches, setLoadingMatches] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [createData, setCreateData] = useState({
    title: "", type: "medical", description: "", urgency: 3,
    volunteers_needed: 1, latitude: 23.022, longitude: 72.571,
    deadline: "", locationLabel: ""
  })
  const [creating, setCreating] = useState(false)
  const [weatherWarning, setWeatherWarning] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null)
    try {
      const data = await requestAPI.getAll({
        user_id: user.id,
        status: statusFilter === "all" ? undefined : statusFilter,
        type: typeFilter === "all" ? undefined : typeFilter,
        urgency: urgencyFilter, limit: LIMIT, offset: page * LIMIT,
      })
      setRequests(data.items); setTotal(data.total)
    } catch (e: unknown) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [user?.id, statusFilter, typeFilter, urgencyFilter, page])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  // B1: Weather check on pin change
  const handleMapPinChange = async (lat: number, lng: number, label: string) => {
    setCreateData(prev => ({ ...prev, latitude: lat, longitude: lng, locationLabel: label }))
    setWeatherWarning(null)
    try {
      const weather = await externalAPI.getWeather(lat, lng)
      if (weather.severity === "high" || weather.severity === "extreme") {
        setWeatherWarning(`⚠️ Weather Alert: ${weather.severity} severity detected. Urgency auto-increased.`)
        setCreateData(prev => ({ ...prev, urgency: Math.min(5, prev.urgency + 1) }))
      }
    } catch {}
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setCreating(true)
    try {
      const payload: any = {
        title: createData.title, type: createData.type,
        description: createData.description, urgency: createData.urgency,
        volunteers_needed: createData.volunteers_needed,
        latitude: createData.latitude, longitude: createData.longitude,
        source: "internal"
      }
      if (createData.deadline) payload.deadline = new Date(createData.deadline).toISOString()
      const newReq: any = await requestAPI.create(user.id, payload)
      await matchingAPI.assignBest(newReq.id).catch(() => {})
      setShowCreate(false)
      setCreateData({ title: "", type: "medical", description: "", urgency: 3, volunteers_needed: 1, latitude: 23.022, longitude: 72.571, deadline: "", locationLabel: "" })
      setWeatherWarning(null)
      fetchRequests()
    } catch (err: unknown) { alert((err as Error).message || "Failed to create request") }
    finally { setCreating(false) }
  }

  const handleFindMatches = async (requestId: number) => {
    setActiveRequestId(requestId); setShowMatchModal(true)
    setLoadingMatches(true); setMatchCandidates([])
    try {
      const result = await matchingAPI.getMatches(requestId, 3)
      if (result.success && result.candidates) setMatchCandidates(result.candidates)
    } catch (e: unknown) { alert((e as Error).message) }
    finally { setLoadingMatches(false) }
  }

  const handleManualAssign = async (volunteerId: number, matchScore: number) => {
    if (!activeRequestId) return
    setAssigning(volunteerId)
    try {
      await matchingAPI.manualAssign(activeRequestId, volunteerId, matchScore)
      setShowMatchModal(false)
      setRequests(prev => prev.map(r => r.id === activeRequestId ? { ...r, status: "assigned" } : r))
    } catch (e: unknown) { alert((e as Error).message) }
    finally { setAssigning(null) }
  }

  const handleCancel = async (requestId: number) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "cancelled" } : r))
    try { await requestAPI.cancel(requestId) } catch { fetchRequests() }
  }

  return (
    <div className={`p-6 max-w-5xl mx-auto transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* C2: Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Requests</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total requests</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}
        >
          <span>+</span> Create Request
        </button>
      </div>
      <div className="h-px bg-gray-100 mb-5" />

      {/* B1: Enhanced Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Request</h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Title</label>
                <input required type="text" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" value={createData.title} onChange={e => setCreateData(prev => ({...prev, title: e.target.value}))} placeholder="E.g. Flood Relief Needed" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
                  <select className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={createData.type} onChange={e => setCreateData(prev => ({...prev, type: e.target.value}))}>
                    {REQUEST_TYPES.filter(t => t !== "all").map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Volunteers Needed</label>
                  <input required type="number" min="1" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={createData.volunteers_needed} onChange={e => setCreateData(prev => ({...prev, volunteers_needed: Number(e.target.value)}))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                <textarea required className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" rows={2} value={createData.description} onChange={e => setCreateData(prev => ({...prev, description: e.target.value}))} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Urgency (1-5): {createData.urgency}</label>
                  <input type="range" min="1" max="5" className="w-full accent-blue-600" value={createData.urgency} onChange={e => setCreateData(prev => ({...prev, urgency: Number(e.target.value)}))} />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Deadline</label>
                  <input type="datetime-local" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={createData.deadline} onChange={e => setCreateData(prev => ({...prev, deadline: e.target.value}))} />
                </div>
              </div>
              {/* B1: Map Pin Picker */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Location (click map to set)</label>
                <MapPinPicker
                  initialLat={createData.latitude}
                  initialLng={createData.longitude}
                  onChange={handleMapPinChange}
                />
              </div>
              {/* B1: Weather warning */}
              {weatherWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 font-medium">
                  {weatherWarning}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setWeatherWarning(null) }} className="flex-1 border border-gray-200 p-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 text-white p-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-all active:scale-95" style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}>
                  {creating ? "Creating..." : "Create & Auto-Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Match Modal */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">✦ Top 3 Matching Volunteers</h2>
              <button onClick={() => setShowMatchModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
            </div>
            {loadingMatches ? <PageSkeleton rows={3} /> : matchCandidates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">🔍</p>
                <p className="text-sm text-gray-500">No active volunteers match this request right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matchCandidates.map((c, i) => (
                  <div key={c.volunteer_id} className={`border rounded-2xl p-4 flex justify-between items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fadeInUp ${i === 0 ? 'border-amber-300 bg-amber-50/30' : 'border-gray-100 bg-gray-50/50'}`}
                    style={{ animationDelay: `${i * 80}ms` }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">{c.volunteer_name}</span>
                        {i === 0 && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">Best Match ✦</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{c.reason}</p>
                      <div className="flex gap-3 text-[11px] text-gray-400 mt-2">
                        <span>Score: {(c.match_score * 100).toFixed(0)}%</span>
                        <span>Distance: {c.distance_km < 0.1 ? '< 0.1' : c.distance_km.toFixed(1)}km</span>
                      </div>
                    </div>
                    <button disabled={assigning === c.volunteer_id} onClick={() => handleManualAssign(c.volunteer_id, c.match_score)}
                      className="text-xs text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-50 flex-shrink-0 transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}>
                      {assigning === c.volunteer_id ? "Assigning..." : "✦ Assign"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(0) }}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all capitalize ${
                statusFilter === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}>{s}</button>
          ))}
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0) }}
          className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {REQUEST_TYPES.map(t => (
            <option key={t} value={t}>{t === "all" ? "All types" : t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select value={urgencyFilter ?? ""} onChange={e => { setUrgencyFilter(e.target.value ? Number(e.target.value) : undefined); setPage(0) }}
          className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Any urgency</option>
          {[5, 4, 3, 2, 1].map(u => <option key={u} value={u}>Urgency {u}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading && <PageSkeleton rows={6} />}
      {error && <ErrorState message={error} onRetry={fetchRequests} />}

      {!loading && !error && (
        <>
          <div className="space-y-2">
            {requests.map((req, idx) => (
              <div key={req.id}
                className={`bg-white border border-gray-100 border-l-4 ${URGENCY_BORDERS[req.urgency] || 'border-l-gray-300'} rounded-2xl p-4 flex items-start justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fadeInUp ${
                  req.status === "cancelled" ? "opacity-50" : ""
                } ${req.urgency === 5 ? 'shadow-[0_0_12px_rgba(239,68,68,0.08)]' : ''}`}
                style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`font-medium text-sm ${req.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{req.title}</span>
                    {req.source === "ndma_feed" && (
                      <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full font-bold">NDMA</span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${URGENCY_COLORS[req.urgency]}`}>
                      Urgency {req.urgency}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[req.status]}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1 mb-1.5">{req.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span>{req.fulfilled_count}/{req.volunteers_needed} volunteers</span>
                    {req.deadline && <DeadlineBadge deadline={req.deadline} />}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {req.status === "pending" && (
                    <button onClick={() => handleFindMatches(req.id)}
                      className="text-xs text-white px-3 py-2 rounded-xl font-medium transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}>
                      ✦ Find Best Matches
                    </button>
                  )}
                  {req.status !== "completed" && req.status !== "cancelled" && (
                    <button onClick={() => handleCancel(req.id)}
                      className="text-xs text-gray-500 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}

            {requests.length === 0 && (
              <div className="text-center py-16 animate-fadeInUp">
                <p className="text-3xl mb-3">✓</p>
                <p className="text-sm font-medium text-gray-500">All clear!</p>
                <p className="text-xs text-gray-400 mt-1">No requests matching this filter</p>
              </div>
            )}
          </div>

          {total > LIMIT && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="text-xs px-3 py-2 border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-all active:scale-95">← Prev</button>
              <span className="text-xs text-gray-500">Page {page + 1} of {Math.ceil(total / LIMIT)}</span>
              <button disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)}
                className="text-xs px-3 py-2 border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-all active:scale-95">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
