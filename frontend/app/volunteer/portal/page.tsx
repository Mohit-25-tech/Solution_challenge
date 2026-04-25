"use client"
import { useEffect, useState, useCallback } from "react"
import { volunteerPortalAPI, assignmentAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { PageSkeleton, ErrorState } from "@/components/page-skeleton"
import { QRGenerator } from "@/components/qr-generator"
import { DeadlineBadge } from "@/components/deadline-badge"
import dynamic from "next/dynamic"

const QRScanner = dynamic(
  () => import("@/components/qr-scanner").then(m => ({ default: m.QRScanner })),
  { ssr: false, loading: () => <div className="h-48 shimmer-gradient rounded-xl" /> }
)

const URGENCY_COLORS: Record<number, string> = {
  5: "bg-red-100 text-red-700", 4: "bg-orange-100 text-orange-700",
  3: "bg-yellow-100 text-yellow-700", 2: "bg-blue-100 text-blue-700",
  1: "bg-gray-100 text-gray-500",
}

const TYPE_BORDERS: Record<string, string> = {
  medical: "border-l-red-500", food: "border-l-orange-500", rescue: "border-l-amber-500",
  construction: "border-l-blue-500", logistics: "border-l-purple-500",
  counseling: "border-l-green-500",
}

type Task = {
  assignment_id: number; request_id: number; match_score: number;
  reason: string; distance_km: number; assignment_status: string;
  assigned_at?: string; accepted_at?: string; completed_at?: string;
  request?: { id: number; type: string; title: string; description: string; urgency: number; status: string; deadline?: string }
}

const STATUS_TABS = ["all", "assigned", "accepted", "completed"]
const TAB_DOTS: Record<string, string> = { assigned: "bg-yellow-500", accepted: "bg-blue-500", completed: "bg-green-500" }

export default function VolunteerPortalPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [showQRModal, setShowQRModal] = useState<number | null>(null)
  const [qrTab, setQrTab] = useState<"scan" | "show">("show")
  const [mounted, setMounted] = useState(false)

  const volunteerId = user?.volunteer_id
  useEffect(() => { setMounted(true) }, [])

  const fetchTasks = useCallback(async () => {
    if (!volunteerId) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const data = await volunteerPortalAPI.getTasks(volunteerId, statusFilter === "all" ? undefined : statusFilter)
      setTasks(data || [])
    } catch (e: unknown) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [volunteerId, statusFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleAccept = async (assignmentId: number) => {
    setActionLoading(assignmentId)
    try {
      await assignmentAPI.accept(assignmentId)
      setTasks(prev => prev.map(t => t.assignment_id === assignmentId ? { ...t, assignment_status: "accepted" } : t))
    } catch (e: unknown) { alert((e as Error).message) }
    finally { setActionLoading(null) }
  }

  const handleReject = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to reject this task?")) return
    setActionLoading(assignmentId)
    try {
      await assignmentAPI.reject(assignmentId)
      setTasks(prev => prev.map(t => t.assignment_id === assignmentId ? { ...t, assignment_status: "rejected" } : t))
    } catch (e: unknown) { alert((e as Error).message) }
    finally { setActionLoading(null) }
  }

  const handleComplete = async (assignmentId: number) => {
    if (!confirm("Mark this task as completed?")) return
    setActionLoading(assignmentId)
    try {
      await assignmentAPI.complete(assignmentId)
      setTasks(prev => prev.map(t => t.assignment_id === assignmentId ? { ...t, assignment_status: "completed" } : t))
    } catch (e: unknown) { alert((e as Error).message) }
    finally { setActionLoading(null) }
  }

  if (!volunteerId && !loading) {
    return (
      <div className="p-6 text-center py-20 bg-white border border-gray-100 rounded-2xl m-6 shadow-sm animate-fadeInUp">
        <p className="text-3xl mb-3">🔗</p>
        <p className="text-gray-900 font-medium text-lg">No volunteer profile found.</p>
        <p className="text-sm text-gray-500 mt-1 mb-4">Set up your profile before receiving tasks.</p>
        <a href="/volunteer/profile"
          className="inline-block text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}>
          Create Profile
        </a>
      </div>
    )
  }

  return (
    <div className={`p-6 max-w-3xl mx-auto space-y-5 transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Missions</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track and manage your assignments</p>
      </div>
      <div className="h-px bg-gray-100" />

      {/* Status tabs with colored dots */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium capitalize transition-all ${
              statusFilter === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}>
            {s !== "all" && <span className={`w-1.5 h-1.5 rounded-full ${TAB_DOTS[s] || 'bg-gray-400'}`} />}
            {s}
          </button>
        ))}
      </div>

      {loading && <PageSkeleton rows={4} />}
      {error && <ErrorState message={error} onRetry={fetchTasks} />}

      {!loading && !error && (
        <div className="space-y-3">
          {tasks.length === 0 && (
            <div className="text-center py-16 animate-fadeInUp">
              <p className="text-3xl mb-3">👋</p>
              <p className="text-sm font-medium text-gray-500">No missions yet</p>
              <p className="text-xs text-gray-400 mt-1">Check Available Work to get started</p>
              <a href="/volunteer/available" className="inline-block mt-4 text-xs text-blue-600 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 transition-all">
                Browse Available Work →
              </a>
            </div>
          )}

          {tasks.map((task, idx) => {
            const req = task.request
            const typeColor = TYPE_BORDERS[req?.type || ''] || 'border-l-gray-300'
            const isCompleted = task.assignment_status === 'completed'
            const scorePct = Math.round(task.match_score * 100)

            return (
              <div key={task.assignment_id}
                className={`border border-l-4 ${typeColor} rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fadeInUp ${
                  isCompleted ? 'bg-green-50/50 border-green-100' : 'bg-white border-gray-100'
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}>
                {/* Title row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{req?.title || `Task #${task.request_id}`}</p>
                    {req && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize font-medium">{req.type.replace(/_/g, " ")}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${URGENCY_COLORS[req.urgency]}`}>
                          Urgency {req.urgency}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {task.distance_km < 0.1 ? '< 0.1' : task.distance_km.toFixed(1)}km away
                        </span>
                        {req.deadline && <DeadlineBadge deadline={req.deadline} />}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 capitalize ${
                    task.assignment_status === "completed" ? "bg-green-100 text-green-800" :
                    task.assignment_status === "accepted" ? "bg-blue-100 text-blue-800" :
                    task.assignment_status === "assigned" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-500"
                  }`}>{task.assignment_status}</span>
                </div>

                {/* Description */}
                {req?.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{req.description}</p>}

                {/* Score bar */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${scorePct}%` }} />
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">{scorePct}% match</span>
                  </div>
                </div>

                {/* B6: QR Check-in for accepted tasks */}
                {task.assignment_status === "accepted" && (
                  <div className="flex items-center gap-2 mb-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => { setShowQRModal(task.assignment_id); setQrTab("show") }}
                      className="flex items-center gap-1.5 text-xs text-white px-4 py-2 rounded-xl font-medium transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                      📷 Check In via QR
                    </button>
                    <button disabled={actionLoading === task.assignment_id}
                      onClick={() => handleComplete(task.assignment_id)}
                      className="text-xs bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl hover:bg-green-100 disabled:opacity-50 font-medium transition-all active:scale-95">
                      {actionLoading === task.assignment_id ? "..." : "✓ Complete"}
                    </button>
                  </div>
                )}

                {/* Actions for assigned */}
                {task.assignment_status === "assigned" && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button disabled={actionLoading === task.assignment_id} onClick={() => handleAccept(task.assignment_id)}
                      className="flex-1 text-xs text-white py-2 rounded-xl font-medium disabled:opacity-60 transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}>
                      {actionLoading === task.assignment_id ? "..." : "✓ Accept"}
                    </button>
                    <button disabled={actionLoading === task.assignment_id} onClick={() => handleReject(task.assignment_id)}
                      className="flex-1 text-xs border border-red-200 text-red-600 py-2 rounded-xl hover:bg-red-50 disabled:opacity-60 font-medium transition-all active:scale-95">
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

      {/* B6: QR Check-in Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Check In</h2>
              <button onClick={() => setShowQRModal(null)} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
              {(["show", "scan"] as const).map(t => (
                <button key={t} onClick={() => setQrTab(t)}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                    qrTab === t ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                  }`}>
                  {t === "show" ? "Show QR (NGO scans me)" : "Scan QR"}
                </button>
              ))}
            </div>
            {qrTab === "show" && (
              <div className="flex justify-center">
                <QRGenerator assignmentId={showQRModal} />
              </div>
            )}
            {qrTab === "scan" && (
              <QRScanner onSuccess={() => { setTimeout(() => setShowQRModal(null), 2000) }} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
