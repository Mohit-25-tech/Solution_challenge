"use client"
import { useEffect, useState, useCallback } from "react"
import { volunteerAPI, analyticsAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { AvailabilityGrid } from "@/components/availability-grid"
import { BadgeList } from "@/components/badge-chip"
import { PageSkeleton } from "@/components/page-skeleton"

type HistoryItem = {
  assignment_id: number
  request_title: string
  request_type: string
  match_score: number
  status: string
  assigned_at: string
  completed_at?: string
}

type Stats = {
  tasks_completed: number
  acceptance_rate: number
  avg_response_time_minutes?: number
  badges: string[]
}

type VolunteerData = {
  skills: string[]
  is_available: boolean
  reliability_score: number
  bio?: string
  phone?: string
  badges?: string[]
  availability_slots?: Record<string, string[]>
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  accepted: "bg-blue-100 text-blue-800",
  assigned: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
}

export default function VolunteerProfilePage() {
  const { user, updateSessionUser } = useAuth()
  const [volunteer, setVolunteer] = useState<VolunteerData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [slots, setSlots] = useState<Partial<Record<string, string[]>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<"profile" | "history">("profile")

  // For Profile Onboarding
  const [creatingProfile, setCreatingProfile] = useState(false)
  const [onboardData, setOnboardData] = useState({
    bio: "",
    phone: "",
    skills: "medical, logistics"
  })

  const load = useCallback(async () => {
    const volunteerId = user?.volunteer_id
    if (!volunteerId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [vol, stat, hist] = await Promise.all([
        volunteerAPI.getById(volunteerId),
        analyticsAPI.getVolunteerStats(volunteerId),
        volunteerAPI.getHistory(volunteerId),
      ])
      setVolunteer(vol)
      setStats(stat)
      setHistory(hist)
      setSlots(vol.availability_slots || {})
    } finally {
      setLoading(false)
    }
  }, [user?.volunteer_id])

  useEffect(() => { load() }, [load])

  const handleSaveProfile = async () => {
    if (!user?.volunteer_id) return
    setSaving(true)
    try {
      await volunteerAPI.update(user.volunteer_id, { availability_slots: slots })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAvailable = async () => {
    if (!user?.volunteer_id || !volunteer) return
    const newVal = !volunteer.is_available
    setVolunteer({ ...volunteer, is_available: newVal })
    try {
      await volunteerAPI.toggleAvailability(user.volunteer_id, newVal)
    } catch {
      setVolunteer({ ...volunteer, is_available: !newVal })
    }
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setCreatingProfile(true)
    try {
      // Create volunteer record
      const skillsArray = onboardData.skills.split(",").map(s => s.trim().toLowerCase()).filter(s => s)
      const res: any = await volunteerAPI.create(user.id, {
        bio: onboardData.bio,
        phone: onboardData.phone,
        skills: skillsArray,
        is_available: true,
        latitude: 28.6139,
        longitude: 77.2090
      })
      // Instantly inject ID into Next.js auth system
      if (res.id) {
        updateSessionUser({ ...user, volunteer_id: res.id })
      }
    } catch (e: unknown) {
      alert((e as Error).message || "Failed to create profile")
    } finally {
      setCreatingProfile(false)
    }
  }

  if (!user?.volunteer_id && !loading) {
    return (
      <div className="p-6 max-w-md mx-auto mt-10 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="text-center mb-6">
          <p className="text-3xl mb-3">👋</p>
          <h2 className="text-lg font-bold text-gray-900">Welcome to VolunteerMatch</h2>
          <p className="text-sm text-gray-500 mt-1">Let's set up your profile so NGOs can find you.</p>
        </div>

        <form onSubmit={handleCreateProfile} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Phone Number</label>
            <input 
              type="text" 
              required 
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" 
              placeholder="+1 234 567 8900"
              value={onboardData.phone}
              onChange={e => setOnboardData({...onboardData, phone: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Primary Skills (comma separated)</label>
            <input 
              type="text" 
              required 
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" 
              placeholder="medical, rescue, cooking..."
              value={onboardData.skills}
              onChange={e => setOnboardData({...onboardData, skills: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Short Bio</label>
            <textarea 
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" 
              placeholder="Tell us a little about your experience..."
              value={onboardData.bio}
              onChange={e => setOnboardData({...onboardData, bio: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={creatingProfile}
            className="w-full bg-blue-600 text-white font-medium text-sm py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 mt-4"
          >
            {creatingProfile ? "Creating..." : "Create My Profile"}
          </button>
        </form>
      </div>
    )
  }

  if (loading) return <div className="p-6"><PageSkeleton rows={6} /></div>
  if (!volunteer) return null

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500">{user?.name}</p>
        </div>
        <button
          onClick={handleToggleAvailable}
          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
            volunteer.is_available
              ? "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {volunteer.is_available ? "● Available" : "○ Unavailable"}
        </button>
      </div>

      {/* Badges */}
      {volunteer.badges && volunteer.badges.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 mb-3">🏅 Badges Earned</p>
          <BadgeList badges={volunteer.badges} />
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Tasks done", value: stats.tasks_completed, emoji: "✅" },
            { label: "Acceptance", value: `${stats.acceptance_rate}%`, emoji: "📊" },
            {
              label: "Avg response",
              value: stats.avg_response_time_minutes
                ? `${stats.avg_response_time_minutes.toFixed(1)}m`
                : "—",
              emoji: "⚡"
            },
          ].map(c => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-lg mb-0.5">{c.emoji}</div>
              <p className="text-xl font-bold text-gray-900">{c.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(["profile", "history"] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-1 text-xs rounded-md font-medium capitalize transition-colors ${
              activeTab === t ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
            }`}
          >
            {t === "history" ? `History (${history.length})` : "Profile"}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
          {/* Skills */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Skills</p>
            <div className="flex flex-wrap gap-1">
              {(volunteer.skills || []).map(s => (
                <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize font-medium">
                  {s.replace(/_/g, " ")}
                </span>
              ))}
              {(volunteer.skills || []).length === 0 && (
                <span className="text-xs text-gray-400">No skills listed</span>
              )}
            </div>
          </div>

          {/* Reliability */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-xs font-medium text-gray-500">Reliability Score</p>
              <span className="text-xs font-semibold text-gray-700">
                {(volunteer.reliability_score * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${volunteer.reliability_score * 100}%` }}
              />
            </div>
          </div>

          {/* Availability Grid */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-3">Weekly Availability</p>
            <AvailabilityGrid value={slots} onChange={setSlots} />
          </div>

          {/* Save */}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className={`w-full text-sm py-2 rounded-lg font-medium transition-colors ${
              saved
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            }`}
          >
            {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-2">
          {history.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              <p className="text-2xl mb-2">📭</p>
              No task history yet
            </div>
          )}
          {history.map(h => (
            <div key={h.assignment_id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{h.request_title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="capitalize">{h.request_type.replace(/_/g, " ")}</span>
                    {" · "}Score {(h.match_score * 100).toFixed(0)}%
                    {" · "}{new Date(h.assigned_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                  STATUS_COLORS[h.status] || "bg-gray-100 text-gray-500"
                }`}>
                  {h.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
