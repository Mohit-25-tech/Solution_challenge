"use client"
import { useEffect, useState, useCallback } from "react"
import { volunteerPortalAPI, assignmentAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { PageSkeleton, ErrorState } from "@/components/page-skeleton"
import { QRGenerator } from "@/components/qr-generator"
import { BadgeList } from "@/components/badge-chip"

const URGENCY_COLORS: Record<number, string> = {
  5: "bg-red-100 text-red-800",
  4: "bg-orange-100 text-orange-800",
  3: "bg-yellow-100 text-yellow-800",
  2: "bg-blue-100 text-blue-800",
  1: "bg-gray-100 text-gray-500",
}

const STATUS_COLORS: Record<string, string> = {
  assigned: "bg-amber-50 border-amber-200",
  accepted: "bg-blue-50 border-blue-200",
  completed: "bg-green-50 border-green-200",
  rejected: "bg-red-50 border-red-200",
  expired: "bg-gray-50 border-gray-200",
}

type Task = {
  assignment_id: number
  request_id: number
  match_score: number
  reason: string
  distance_km: number
  assignment_status: string
  assigned_at?: string
  accepted_at?: string
  completed_at?: string
  request?: {
    id: number
    type: string
    title: string
    description: string
    urgency: number
    status: string
  }
}

const STATUS_TABS = ["all", "assigned", "accepted", "completed"]

export default function VolunteerPortalPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [showQR, setShowQR] = useState<number | null>(null)

  const volunteerId = user?.volunteer_id

  const fetchTasks = useCallback(async () => {
    if (!volunteerId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await volunteerPortalAPI.getTasks(
        volunteerId,
        statusFilter === "all" ? undefined : statusFilter
      )
      setTasks(data || [])
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [volunteerId, statusFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleAccept = async (assignmentId: number) => {
    setActionLoading(assignmentId)
    try {
      await assignmentAPI.accept(assignmentId)
      setTasks(prev => prev.map(t =>
        t.assignment_id === assignmentId ? { ...t, assignment_status: "accepted" } : t
      ))
    } catch (e: unknown) {
      alert((e as Error).message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to reject this task?")) return
    setActionLoading(assignmentId)
    try {
      await assignmentAPI.reject(assignmentId)
      setTasks(prev => prev.map(t =>
        t.assignment_id === assignmentId ? { ...t, assignment_status: "rejected" } : t
      ))
    } catch (e: unknown) {
      alert((e as Error).message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleComplete = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to mark this task as completed?")) return
    setActionLoading(assignmentId)
    try {
      await assignmentAPI.complete(assignmentId)
      setTasks(prev => prev.map(t =>
        t.assignment_id === assignmentId ? { ...t, assignment_status: "completed" } : t
      ))
      alert("🎉 Task Marked as Completed! Check your Analytics and Badges!")
    } catch (e: unknown) {
      alert((e as Error).message)
    } finally {
      setActionLoading(null)
    }
  }

  if (!volunteerId && !loading) {
    return (
      <div className="p-6 text-center py-20 bg-white border border-gray-100 rounded-xl m-6 shadow-sm">
        <p className="text-2xl mb-2">🔗</p>
        <p className="text-gray-900 font-medium text-lg">No volunteer profile found.</p>
        <p className="text-sm text-gray-500 mt-1 mb-4">You need to set up your profile before receiving tasks.</p>
        <a 
          href="/volunteer/profile" 
          className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition"
        >
          Create Profile
        </a>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">My Tasks</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track and manage your assignments</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 text-xs rounded-md font-medium capitalize transition-colors ${
              statusFilter === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && <PageSkeleton rows={4} />}
      {error && <ErrorState message={error} onRetry={fetchTasks} />}

      {!loading && !error && (
        <div className="space-y-3">
          {tasks.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">
              <p className="text-2xl mb-2">📭</p>
              No {statusFilter === "all" ? "" : statusFilter} tasks yet
            </div>
          )}

          {tasks.map(task => {
            const req = task.request
            const bgClass = STATUS_COLORS[task.assignment_status] || "bg-white border-gray-200"

            return (
              <div key={task.assignment_id} className={`border rounded-xl p-4 transition-all ${bgClass}`}>
                {/* Title row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{req?.title || `Task #${task.request_id}`}</p>
                    {req && (
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-500 capitalize">{req.type.replace(/_/g, " ")}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${URGENCY_COLORS[req.urgency]}`}>
                          Urgency {req.urgency}
                        </span>
                        <span className="text-[10px] text-gray-400">{task.distance_km}km away</span>
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 capitalize ${
                    task.assignment_status === "completed" ? "bg-green-100 text-green-800" :
                    task.assignment_status === "accepted" ? "bg-blue-100 text-blue-800" :
                    task.assignment_status === "assigned" ? "bg-amber-100 text-amber-800" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {task.assignment_status}
                  </span>
                </div>

                {/* Description */}
                {req?.description && (
                  <p className="text-xs text-gray-500 mb-2.5 line-clamp-2">{req.description}</p>
                )}

                {/* Match info */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] text-gray-400">Score {(task.match_score * 100).toFixed(0)}%</span>
                  <span className="text-[11px] text-gray-400">{task.reason}</span>
                </div>

                {/* QR code section (accepted tasks) */}
                {task.assignment_status === "accepted" && (
                  <div className="mb-3 border-t pt-3 mt-3">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setShowQR(showQR === task.assignment_id ? null : task.assignment_id)}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        {showQR === task.assignment_id ? "Hide QR Code" : "Show QR code for check-in"}
                      </button>
                      <button
                        disabled={actionLoading === task.assignment_id}
                        onClick={() => handleComplete(task.assignment_id)}
                        className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 disabled:opacity-50 font-medium"
                      >
                        {actionLoading === task.assignment_id ? "..." : "✓ Mark as Completed"}
                      </button>
                    </div>
                    {showQR === task.assignment_id && (
                      <div className="mt-3 bg-gray-50 p-4 rounded-xl border">
                        <QRGenerator assignmentId={task.assignment_id} />
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {task.assignment_status === "assigned" && (
                  <div className="flex gap-2">
                    <button
                      disabled={actionLoading === task.assignment_id}
                      onClick={() => handleAccept(task.assignment_id)}
                      className="flex-1 text-xs bg-blue-600 text-white py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium transition-colors"
                    >
                      {actionLoading === task.assignment_id ? "..." : "✓ Accept"}
                    </button>
                    <button
                      disabled={actionLoading === task.assignment_id}
                      onClick={() => handleReject(task.assignment_id)}
                      className="flex-1 text-xs border border-red-200 text-red-600 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-60 font-medium transition-colors"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}

                {/* Timestamps */}
                {task.assigned_at && (
                  <p className="text-[10px] text-gray-300 mt-2">
                    Assigned {new Date(task.assigned_at).toLocaleDateString()}
                    {task.completed_at && ` · Completed ${new Date(task.completed_at).toLocaleDateString()}`}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
