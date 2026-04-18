"use client"
import { useEffect, useState, useCallback } from "react"
import { volunteerPortalAPI, matchingAPI, assignmentAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { PageSkeleton, ErrorState } from "@/components/page-skeleton"

const URGENCY_COLORS: Record<number, string> = {
  5: "border-l-red-500 bg-red-50/30",
  4: "border-l-orange-500 bg-orange-50/30",
  3: "border-l-yellow-500 bg-yellow-50/30",
  2: "border-l-blue-500 bg-blue-50/30",
  1: "border-l-gray-300 bg-white",
}

type TaskItem = {
  volunteer_id: number
  match_score: number
  reason: string
  distance_km: number
  request_id: number
  request?: {
    id: number
    type: string
    title: string
    description: string
    urgency: number
    status: string
    volunteers_needed: number
    fulfilled_count: number
    source?: string
  }
}

export default function VolunteerAvailablePage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lat, setLat] = useState(28.6139)    // Default: New Delhi
  const [lng, setLng] = useState(77.209)
  const [applying, setApplying] = useState<number | null>(null)

  const volunteerId = user?.volunteer_id

  const fetchNearby = useCallback(async () => {
    if (!volunteerId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await volunteerPortalAPI.getNearby(volunteerId, lat, lng, 20)
      setTasks(data || [])
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [volunteerId, lat, lng])

  useEffect(() => {
    // Use browser geolocation if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLat(pos.coords.latitude)
          setLng(pos.coords.longitude)
        },
        () => fetchNearby()  // Permission denied — use defaults
      )
    } else {
      fetchNearby()
    }
  }, [])

  useEffect(() => { fetchNearby() }, [fetchNearby])

  const handleApply = async (requestId: number, matchScore: number) => {
    if (!volunteerId) return;
    setApplying(requestId)
    try {
      // 1. Assign self to the task
      const assignRes: any = await matchingAPI.manualAssign(requestId, volunteerId, matchScore);
      if (assignRes.assignment_id) {
        // 2. Auto-accept since it was a proactive claim
        await assignmentAPI.accept(assignRes.assignment_id);
        alert("Task successfully claimed! Moving you to My Tasks...");
        fetchNearby() // refresh list to remove the claimed one
      } else {
        alert(assignRes.message || "Could not claim task")
      }
    } catch (e: unknown) {
      alert((e as Error).message || "Failed to claim task")
    } finally {
      setApplying(null)
    }
  }

  if (!volunteerId && !loading) {
    return (
      <div className="p-6 text-center py-20 bg-white border border-gray-100 rounded-xl m-6 shadow-sm">
        <p className="text-2xl mb-2">👤</p>
        <p className="text-gray-900 font-medium text-lg">No volunteer profile found.</p>
        <p className="text-sm text-gray-500 mt-1 mb-4">You need to complete your profile before you can see available work.</p>
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
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Available Work</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Showing tasks within 25km · sorted by best match
          </p>
        </div>
        <button
          onClick={fetchNearby}
          className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ↺ Refresh
        </button>
      </div>

      {loading && <PageSkeleton rows={5} />}
      {error && <ErrorState message={error} onRetry={fetchNearby} />}

      {!loading && !error && (
        <div className="space-y-3">
          {tasks.length === 0 && (
            <div className="text-center py-16">
              <p className="text-2xl mb-2">🗺️</p>
              <p className="text-sm text-gray-400">No tasks found near you right now</p>
              <p className="text-xs text-gray-300 mt-1">Check back later or widen your skills</p>
            </div>
          )}

          {tasks.map(task => {
            const req = task.request
            const borderClass = URGENCY_COLORS[req?.urgency ?? 1]
            const scorePct = Math.round(task.match_score * 100)

            return (
              <div
                key={`${task.request_id}-${task.match_score}`}
                className={`border border-l-4 rounded-xl p-4 ${borderClass} transition-all hover:shadow-sm`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900">
                        {req?.title || `Request #${task.request_id}`}
                      </span>
                      {req?.source === "ndma_feed" && (
                        <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-bold">
                          NDMA
                        </span>
                      )}
                    </div>
                    {req && (
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">
                        {req.type.replace(/_/g, " ")} · Urgency {req.urgency}/5 · {req.fulfilled_count}/{req.volunteers_needed} filled
                      </p>
                    )}
                  </div>

                  {/* Match score */}
                  <div className="text-center flex-shrink-0">
                    <div className={`text-lg font-bold ${scorePct >= 70 ? "text-green-600" : scorePct >= 50 ? "text-amber-600" : "text-gray-500"}`}>
                      {scorePct}%
                    </div>
                    <div className="text-[9px] text-gray-400 -mt-0.5">match</div>
                  </div>
                </div>

                {/* Description */}
                {req?.description && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{req.description}</p>
                )}

                {/* Meta row & Action */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span>📍 {task.distance_km}km away</span>
                    <span className="truncate max-w-[200px]">{task.reason}</span>
                  </div>
                  
                  <button
                    onClick={() => handleApply(req?.id ?? 0, task.match_score)}
                    disabled={applying === req?.id}
                    className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {applying === req?.id ? "Claiming..." : "Claim Task"}
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
