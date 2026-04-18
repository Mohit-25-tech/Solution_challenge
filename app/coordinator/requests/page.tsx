"use client"
import { useEffect, useState, useCallback } from "react"
import { requestAPI, matchingAPI } from "@/lib/api"
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
  const [requests, setRequests] = useState<Request[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [urgencyFilter, setUrgencyFilter] = useState<number | undefined>()
  const [page, setPage] = useState(0)
  const [assigning, setAssigning] = useState<number | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await requestAPI.getAll({
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
  }, [statusFilter, typeFilter, urgencyFilter, page])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleAssignBest = async (requestId: number) => {
    setAssigning(requestId)
    try {
      await matchingAPI.assignBest(requestId)
      // Optimistically update status
      setRequests(prev =>
        prev.map(r => r.id === requestId ? { ...r, status: "assigned" } : r)
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
          <p className="text-sm text-gray-500 mt-0.5">{total} total</p>
        </div>
      </div>

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
                      onClick={() => handleAssignBest(req.id)}
                      disabled={assigning === req.id}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium transition-colors"
                    >
                      {assigning === req.id ? "Assigning..." : "Assign Best"}
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
