"use client"
import { useEffect, useState, useRef } from "react"
import { notificationAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

type Notification = {
  id: number
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

const TYPE_COLORS: Record<string, string> = {
  assigned: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-emerald-100 text-emerald-700",
  escalated: "bg-orange-100 text-orange-700",
  badge_earned: "bg-purple-100 text-purple-700",
  weather_alert: "bg-yellow-100 text-yellow-700",
}

export function NotificationBell() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    if (!user?.id) return
    try {
      const data = await notificationAPI.getAll(user.id, 15)
      setNotifs(data.notifications || [])
      setUnread(data.unread_count || 0)
    } catch {
      // Fail silently — bell is non-critical
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user?.id])

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleMarkAll = async () => {
    if (!user?.id) return
    await notificationAPI.markAllRead(user.id)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
  }

  const handleMarkOne = async (id: number) => {
    await notificationAPI.markRead(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        {/* Bell icon */}
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {/* Unread badge */}
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900">Notifications</span>
              {unread > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 && (
              <div className="px-4 py-10 text-center text-gray-400 text-sm">
                <div className="text-2xl mb-2">🔔</div>
                No notifications yet
              </div>
            )}
            {notifs.map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkOne(n.id)}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? "bg-blue-50/40" : ""}`}
              >
                <div className="flex items-start gap-2.5">
                  {!n.is_read && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                  {n.is_read && <span className="w-2 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TYPE_COLORS[n.type] || "bg-gray-100 text-gray-600"}`}>
                        {n.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
