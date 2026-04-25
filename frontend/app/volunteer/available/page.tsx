"use client"
import { useEffect, useState, useCallback } from "react"
import { volunteerPortalAPI, matchingAPI, assignmentAPI, volunteerAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { PageSkeleton, ErrorState } from "@/components/page-skeleton"
import { DeadlineBadge } from "@/components/deadline-badge"

const URGENCY_COLORS: Record<number, string> = {
  5: "border-l-red-500 bg-red-50/40", 4: "border-l-orange-500 bg-orange-50/30",
  3: "border-l-yellow-500 bg-yellow-50/20", 2: "border-l-blue-500 bg-blue-50/20",
  1: "border-l-gray-300 bg-white",
}

const URGENCY_BADGE: Record<number, string> = {
  5: "bg-red-100 text-red-700", 4: "bg-orange-100 text-orange-700",
  3: "bg-yellow-100 text-yellow-700", 2: "bg-blue-100 text-blue-700",
  1: "bg-gray-100 text-gray-500",
}

type TaskItem = {
  volunteer_id: number; match_score: number; reason: string;
  distance_km: number; request_id: number;
  request?: {
    id: number; type: string; title: string; description: string;
    urgency: number; status: string; volunteers_needed: number;
    fulfilled_count: number; source?: string; deadline?: string
  }
}

export default function VolunteerAvailablePage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lat, setLat] = useState(28.6139)
  const [lng, setLng] = useState(77.209)
  const [applying, setApplying] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  const volunteerId = user?.volunteer_id
  useEffect(() => { setMounted(true) }, [])

  const fetchNearby = useCallback(async () => {
    if (!volunteerId) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const data = await volunteerPortalAPI.getNearby(volunteerId, lat, lng, 20)
      setTasks(data || [])
    } catch (e: unknown) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [volunteerId, lat, lng])

  useEffect(() => {
    const fetchLocationAndTasks = async () => {
      if (volunteerId) {
        try {
          const volData = await volunteerAPI.getById(volunteerId);
          if (volData && volData.latitude && volData.longitude) {
            setLat(volData.latitude);
            setLng(volData.longitude);
            return; // `fetchNearby` will be triggered by `lat`/`lng` change or the subsequent `useEffect`
          }
        } catch (e) {
          console.warn("Failed to fetch volunteer location, falling back to geolocation", e);
        }
      }
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude) },
          () => fetchNearby()
        )
      } else { fetchNearby() }
    };

    fetchLocationAndTasks();
  }, [volunteerId])

  useEffect(() => { fetchNearby() }, [fetchNearby])

  const handleApply = async (requestId: number, matchScore: number) => {
    if (!volunteerId) return
    setApplying(requestId)
    try {
      const assignRes: any = await matchingAPI.manualAssign(requestId, volunteerId, matchScore)
      if (assignRes.assignment_id) {
        await assignmentAPI.accept(assignRes.assignment_id)
        fetchNearby()
      } else { alert(assignRes.message || "Could not claim task") }
    } catch (e: unknown) { alert((e as Error).message || "Failed to claim task") }
    finally { setApplying(null) }
  }

  if (!volunteerId && !loading) {
    return (
      <div className="p-6 text-center py-20 bg-white border border-gray-100 rounded-2xl m-6 shadow-sm animate-fadeInUp">
        <p className="text-3xl mb-3">👤</p>
        <p className="text-gray-900 font-medium text-lg">No volunteer profile found.</p>
        <p className="text-sm text-gray-500 mt-1 mb-4">Complete your profile to see available work.</p>
        <a href="/volunteer/profile"
          className="inline-block text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}>
          Create Profile
        </a>
      </div>
    )
  }

  return (
    <div className={`p-6 max-w-3xl mx-auto transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Available Work</h1>
          <p className="text-sm text-gray-400 mt-0.5">Tasks within 25km · sorted by best match</p>
        </div>
        <button onClick={fetchNearby}
          className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all active:scale-95">
          ↺ Refresh
        </button>
      </div>
      <div className="h-px bg-gray-100 mb-5" />

      {loading && <PageSkeleton rows={5} />}
      {error && <ErrorState message={error} onRetry={fetchNearby} />}

      {!loading && !error && (
        <div className="space-y-3">
          {tasks.length === 0 && (
            <div className="text-center py-16 animate-fadeInUp">
              <p className="text-3xl mb-3">🗺️</p>
              <p className="text-sm font-medium text-gray-500">No tasks found near you right now</p>
              <p className="text-xs text-gray-400 mt-1">Check back later or widen your skills</p>
              <button onClick={fetchNearby}
                className="inline-block mt-4 text-xs text-blue-600 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 transition-all">
                ↺ Refresh Now
              </button>
            </div>
          )}

          {tasks.map((task, idx) => {
            const req = task.request
            const borderClass = URGENCY_COLORS[req?.urgency ?? 1]
            const scorePct = Math.round(task.match_score * 100)
            const fillPct = req ? Math.round((req.fulfilled_count / req.volunteers_needed) * 100) : 0

            return (
              <div key={`${task.request_id}-${task.match_score}`}
                className={`border border-l-4 rounded-2xl p-4 ${borderClass} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fadeInUp`}
                style={{ animationDelay: `${idx * 60}ms` }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900">
                        {req?.title || `Request #${task.request_id}`}
                      </span>
                      {req?.source === "ndma_feed" && (
                        <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold">NDMA</span>
                      )}
                    </div>
                    {req && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize font-medium">
                          {req.type.replace(/_/g, " ")}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${URGENCY_BADGE[req.urgency]}`}>
                          Urgency {req.urgency}/5
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {req.fulfilled_count}/{req.volunteers_needed} filled
                        </span>
                        {req.deadline && <DeadlineBadge deadline={req.deadline} />}
                      </div>
                    )}
                  </div>

                  {/* Score badge */}
                  <div className="text-center flex-shrink-0 bg-white border border-gray-100 rounded-xl px-3 py-2">
                    <div className={`text-lg font-bold ${scorePct >= 70 ? "text-green-600" : scorePct >= 50 ? "text-amber-600" : "text-gray-500"}`}>
                      {scorePct}%
                    </div>
                    <div className="text-[9px] text-gray-400 -mt-0.5">match</div>
                  </div>
                </div>

                {req?.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{req.description}</p>}

                {/* Filled meter */}
                {req && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${fillPct}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400">{fillPct}% filled</span>
                  </div>
                )}

                {/* Bottom row */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span>📍 {task.distance_km < 0.1 ? '< 0.1' : task.distance_km.toFixed(1)}km away</span>
                    <span className="truncate max-w-[200px]">{task.reason}</span>
                  </div>
                  <button onClick={() => handleApply(req?.id ?? 0, task.match_score)}
                    disabled={applying === req?.id}
                    className="text-xs text-white px-5 py-2 rounded-xl font-medium disabled:opacity-50 transition-all active:scale-95 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}>
                    {applying === req?.id ? "Claiming..." : "⚡ Claim Task"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
