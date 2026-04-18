"use client"
import { useEffect, useState, useCallback } from "react"
import { requestAPI, matchingAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { PageSkeleton, ErrorState } from "@/components/page-skeleton"

const REQUEST_TYPES = ["all", "medical", "food", "rescue", "construction", "logistics", "counseling"]
const STATUS_TABS = ["all", "pending", "assigned", "completed", "cancelled"]

const URGENCY_COLORS: Record<number, string> = {
  5: "bg-red-100 text-red-800 border-red-200",
  4: "bg-orange-100 text-orange-800 border-orange-200",
  3: "bg-yellow-100 text-yellow-800 border-yellow-200",
  2: "bg-blue-100 text-blue-800 border-blue-200",
  1: "bg-gray-100 text-gray-600 border-gray-200",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  assigned: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-500",
}

type Request = {
  id: number
  type: string
  title: string
  description: string
  urgency: number
  status: string
  volunteers_needed: number
  fulfilled_count: number
  deadline?: string
  source: string
  tags: string[]
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
  
  // New States for Custom Match Modal
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null)
  const [matchCandidates, setMatchCandidates] = useState<any[]>([])
  const [loadingMatches, setLoadingMatches] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [createData, setCreateData] = useState({
    title: "", type: "medical", description: "", urgency: 3, volunteers_needed: 1, latitude: 28.6139, longitude: 77.2090
  })
  const [creating, setCreating] = useState(false)

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true)
    setError(null)
    try {
      const data = await requestAPI.getAll({
        user_id: user.id,
        status: statusFilter === "all" ? undefined : statusFilter,
        type: typeFilter === "all" ? undefined : typeFilter,
        urgency: urgencyFilter,
        limit: LIMIT,
        offset: page * LIMIT,
      })
      setRequests(data.items)
      setTotal(data.total)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [user?.id, statusFilter, typeFilter, urgencyFilter, page])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setCreating(true)
    try {
      const newReq: any = await requestAPI.create(user.id, {
        ...createData,
        source: "internal"
      })
      // Immediately auto assign to top volunteers
      await matchingAPI.assignBest(newReq.id).catch(() => {})
      setShowCreate(false)
      fetchRequests()
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to create request")
    } finally {
      setCreating(false)
    }
  }

  const handleFindMatches = async (requestId: number) => {
    setActiveRequestId(requestId)
    setShowMatchModal(true)
    setLoadingMatches(true)
    setMatchCandidates([])
    try {
      // Top 3 volunteers as requested
      const result = await matchingAPI.getMatches(requestId, 3) 
      if (result.success && result.candidates) {
        setMatchCandidates(result.candidates)
      } else {
        alert(result.message || "No matches found")
      }
    } catch (e: unknown) {
      alert((e as Error).message || "Failed to find matches")
    } finally {
      setLoadingMatches(false)
    }
  }

  const handleManualAssign = async (volunteerId: number, matchScore: number) => {
    if (!activeRequestId) return
    setAssigning(volunteerId)
    try {
      await matchingAPI.manualAssign(activeRequestId, volunteerId, matchScore)
      setShowMatchModal(false)
      // Optimistic update
      setRequests(prev =>
        prev.map(r => r.id === activeRequestId ? { ...r, status: "assigned" } : r)
      )
    } catch (e: unknown) {
      alert((e as Error).message || "Failed to assign volunteer")
    } finally {
      setAssigning(null)
    }
  }

  const handleCancel = async (requestId: number) => {
    // Optimistic update
    setRequests(prev =>
      prev.map(r => r.id === requestId ? { ...r, status: "cancelled" } : r)
    )
    try {
      await requestAPI.cancel(requestId)
    } catch {
      // Revert on failure
      fetchRequests()
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total requests</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Create Request
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Create New Request</h2>
            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Title</label>
                <input required type="text" className="w-full border rounded-lg p-2 text-sm" value={createData.title} onChange={e => setCreateData(prev => ({...prev, title: e.target.value}))} placeholder="E.g. Flood Relief Needed" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Type</label>
                  <select className="w-full border rounded-lg p-2 text-sm" value={createData.type} onChange={e => setCreateData(prev => ({...prev, type: e.target.value}))}>
                    {REQUEST_TYPES.filter(t => t !== "all").map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Volunteers Needed</label>
                  <input required type="number" min="1" className="w-full border rounded-lg p-2 text-sm" value={createData.volunteers_needed} onChange={e => setCreateData(prev => ({...prev, volunteers_needed: Number(e.target.value)}))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Description</label>
                <textarea required className="w-full border rounded-lg p-2 text-sm" rows={2} value={createData.description} onChange={e => setCreateData(prev => ({...prev, description: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Urgency (1-5)</label>
                <input type="range" min="1" max="5" className="w-full" value={createData.urgency} onChange={e => setCreateData(prev => ({...prev, urgency: Number(e.target.value)}))} />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 border p-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 bg-blue-600 text-white p-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{creating ? "Creating..." : "Create & Auto-Assign"}</button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Match/Assign Modal */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Top 3 Matching Volunteers</h2>
              <button onClick={() => setShowMatchModal(false)} className="text-gray-400 hover:text-red-500">✕</button>
            </div>
            
            {loadingMatches ? (
              <div className="space-y-3">
                <PageSkeleton rows={3} />
              </div>
            ) : matchCandidates.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                No active volunteers match this request right now.
              </div>
            ) : (
              <div className="space-y-4">
                {matchCandidates.map((candidate) => (
                  <div key={candidate.volunteer_id} className="border rounded-lg p-4 flex justify-between items-center gap-3 bg-gray-50/50">
                    <div>
                      <div className="font-semibold text-sm">{candidate.volunteer_name}</div>
                      <div className="text-xs text-gray-500 mt-1">{candidate.reason}</div>
                      <div className="flex gap-3 text-[11px] text-gray-400 mt-2">
                        <span>Score: {(candidate.match_score * 100).toFixed(0)}%</span>
                        <span>Distance: {candidate.distance_km}km</span>
                        {candidate.breakdown?.reliability !== undefined && (
                          <span>Reliability: {(candidate.breakdown.reliability * 100).toFixed(0)}%</span>
                        )}
                      </div>
                    </div>
                    <button
                      disabled={assigning === candidate.volunteer_id}
                      onClick={() => handleManualAssign(candidate.volunteer_id, candidate.match_score)}
                      className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex-shrink-0 font-medium"
                    >
                      {assigning === candidate.volunteer_id ? "Assigning..." : "Assign Worker"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Status tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {STATUS_TABS.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(0) }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors capitalize ${
                statusFilter === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(0) }}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {REQUEST_TYPES.map(t => (
            <option key={t} value={t}>{t === "all" ? "All types" : t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>

        {/* Urgency filter */}
        <select
          value={urgencyFilter ?? ""}
          onChange={e => { setUrgencyFilter(e.target.value ? Number(e.target.value) : undefined); setPage(0) }}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Any urgency</option>
          {[5, 4, 3, 2, 1].map(u => (
            <option key={u} value={u}>Urgency {u}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading && <PageSkeleton rows={6} />}
      {error && <ErrorState message={error} onRetry={fetchRequests} />}

      {!loading && !error && (
        <>
          <div className="space-y-2">
            {requests.map(req => (
              <div
                key={req.id}
                className={`bg-white border rounded-xl p-4 flex items-start justify-between gap-4 transition-opacity ${
                  req.status === "cancelled" ? "opacity-50" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-medium text-sm text-gray-900 truncate">{req.title}</span>
                    {req.source === "ndma_feed" && (
                      <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-bold">NDMA</span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${URGENCY_COLORS[req.urgency]}`}>
                      Urgency {req.urgency}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[req.status]}`}>
                      {req.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 line-clamp-1 mb-1.5">{req.description}</p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span>{req.fulfilled_count}/{req.volunteers_needed} volunteers</span>
                    {req.deadline && (
                      <span>Due {new Date(req.deadline).toLocaleDateString()}</span>
                    )}
                    {req.tags && req.tags.length > 0 && (
                      <div className="flex gap-1">
                        {req.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="bg-gray-100 px-1 py-0.5 rounded">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {req.status === "pending" && (
                    <button
                      onClick={() => handleFindMatches(req.id)}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Find Best Matches
                    </button>
                  )}
                  {req.status !== "completed" && req.status !== "cancelled" && (
                    <button
                      onClick={() => handleCancel(req.id)}
                      className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}

            {requests.length === 0 && (
              <div className="text-center py-16 text-gray-400 text-sm">
                <p className="text-2xl mb-2">📋</p>
                No requests found
              </div>
            )}
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                ← Prev
              </button>
              <span className="text-xs text-gray-500">
                Page {page + 1} of {Math.ceil(total / LIMIT)}
              </span>
              <button
                disabled={(page + 1) * LIMIT >= total}
                onClick={() => setPage(p => p + 1)}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
