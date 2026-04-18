"use client"
import { useEffect, useState, useCallback } from "react"
import { volunteerAPI } from "@/lib/api"
import { PageSkeleton, ErrorState } from "@/components/page-skeleton"
import { BadgeList } from "@/components/badge-chip"

const SKILL_OPTIONS = [
  "all", "medical", "first_aid", "construction", "food_distribution",
  "logistics", "counseling", "driving", "search_rescue", "communication"
]

type VolunteerItem = {
  id: number
  name: string
  email: string
  skills: string[]
  is_available: boolean
  reliability_score: number
  tasks_completed: number
  tasks_rejected: number
  badges: string[]
  avg_response_time_minutes?: number
}

type LeaderboardItem = {
  volunteer_id: number
  name: string
  tasks_completed: number
  reliability_score: number
  badges: string[]
  skills: string[]
  avg_response_time_minutes?: number
}

const LIMIT = 20

export default function CoordinatorVolunteersPage() {
  const [volunteers, setVolunteers] = useState<VolunteerItem[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])
  const [activeTab, setActiveTab] = useState<"all" | "leaderboard">("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [skillFilter, setSkillFilter] = useState("all")
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const fetchVolunteers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await volunteerAPI.getAll({
        is_available: availableOnly || undefined,
        skill: skillFilter === "all" ? undefined : skillFilter,
        limit: LIMIT,
        offset: page * LIMIT,
      })
      setVolunteers(data.items)
      setTotal(data.total)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [availableOnly, skillFilter, page])

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const data = await volunteerAPI.getLeaderboard()
      setLeaderboard(data)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === "all") fetchVolunteers()
    else fetchLeaderboard()
  }, [activeTab, fetchVolunteers, fetchLeaderboard])

  const handleToggleAvailability = async (id: number, current: boolean) => {
    // Optimistic update
    setVolunteers(prev =>
      prev.map(v => v.id === id ? { ...v, is_available: !current } : v)
    )
    try {
      await volunteerAPI.toggleAvailability(id, !current)
    } catch {
      // Revert
      setVolunteers(prev =>
        prev.map(v => v.id === id ? { ...v, is_available: current } : v)
      )
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header + Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Volunteers</h1>
          {activeTab === "all" && (
            <p className="text-sm text-gray-500 mt-0.5">{total} total</p>
          )}
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(["all", "leaderboard"] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1 text-xs rounded-md font-medium capitalize transition-colors ${
                activeTab === t ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "leaderboard" ? "🏆 Leaderboard" : "All Volunteers"}
            </button>
          ))}
        </div>
      </div>

      {/* All Volunteers Tab */}
      {activeTab === "all" && (
        <>
          {/* Filters */}
          <div className="flex gap-3 mb-5 flex-wrap items-center">
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={e => { setAvailableOnly(e.target.checked); setPage(0) }}
                className="rounded border-gray-300"
              />
              Available only
            </label>
            <select
              value={skillFilter}
              onChange={e => { setSkillFilter(e.target.value); setPage(0) }}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SKILL_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s === "all" ? "All skills" : s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {loading && <PageSkeleton rows={6} />}
          {error && <ErrorState message={error} onRetry={fetchVolunteers} />}

          {!loading && !error && (
            <>
              <div className="space-y-2">
                {volunteers.map(v => (
                  <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm text-gray-900">{v.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          v.is_available ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                        }`}>
                          {v.is_available ? "● Available" : "○ Unavailable"}
                        </span>
                      </div>

                      {/* Skills */}
                      <div className="flex gap-1 flex-wrap mb-2">
                        {(v.skills || []).map(s => (
                          <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded capitalize">
                            {s.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>

                      {/* Badges */}
                      {v.badges && v.badges.length > 0 && (
                        <div className="mb-2">
                          <BadgeList badges={v.badges} />
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${v.reliability_score * 100}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-gray-500">
                            {(v.reliability_score * 100).toFixed(0)}% reliable
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400">{v.tasks_completed} completed</span>
                        {v.avg_response_time_minutes && (
                          <span className="text-[11px] text-gray-400">
                            ~{v.avg_response_time_minutes.toFixed(0)}m avg response
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleAvailability(v.id, v.is_available)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors flex-shrink-0 ${
                        v.is_available
                          ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                          : "border-green-200 text-green-700 hover:bg-green-50"
                      }`}
                    >
                      {v.is_available ? "Mark Unavailable" : "Mark Available"}
                    </button>
                  </div>
                ))}

                {volunteers.length === 0 && (
                  <div className="text-center py-16 text-gray-400 text-sm">
                    <p className="text-2xl mb-2">👥</p>
                    No volunteers found
                  </div>
                )}
              </div>

              {total > LIMIT && (
                <div className="flex justify-center items-center gap-3 mt-6">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">← Prev</button>
                  <span className="text-xs text-gray-500">Page {page + 1} of {Math.ceil(total / LIMIT)}</span>
                  <button disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Next →</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <>
          {loading && <PageSkeleton rows={10} />}
          {error && <ErrorState message={error} onRetry={fetchLeaderboard} />}
          {!loading && !error && (
            <div className="space-y-2">
              {leaderboard.map((v, i) => (
                <div key={v.volunteer_id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                  <span className={`text-xl font-bold w-8 text-center flex-shrink-0 ${
                    i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-400" : "text-gray-300"
                  }`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{v.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {v.tasks_completed} tasks · {(v.reliability_score * 100).toFixed(0)}% reliability
                      {v.avg_response_time_minutes && ` · ~${v.avg_response_time_minutes.toFixed(0)}m response`}
                    </p>
                    {v.badges && v.badges.length > 0 && (
                      <div className="mt-1.5">
                        <BadgeList badges={v.badges} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end max-w-32 flex-shrink-0">
                    {(v.skills || []).map(s => (
                      <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded capitalize">
                        {s.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="text-center py-16 text-gray-400 text-sm">No leaderboard data yet</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
