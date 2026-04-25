"use client"
import { useState, useEffect } from "react"

interface DeadlineBadgeProps {
  deadline: string
}

export function DeadlineBadge({ deadline }: DeadlineBadgeProps) {
  const [timeLeft, setTimeLeft] = useState("")
  const [colorClass, setColorClass] = useState("")

  const update = () => {
    const now = new Date()
    const dl = new Date(deadline)
    const diff = dl.getTime() - now.getTime()

    if (diff <= 0) {
      setTimeLeft("Expired")
      setColorClass("bg-red-100 text-red-700 animate-pulse")
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const days = Math.floor(hours / 24)
    const remainHours = hours % 24

    if (hours < 2) {
      setTimeLeft(`${hours > 0 ? `${hours}h ` : ""}${minutes}m left`)
      setColorClass("bg-red-100 text-red-700 animate-pulse")
    } else if (hours < 24) {
      setTimeLeft(`${hours}h ${minutes}m left`)
      setColorClass("bg-orange-100 text-orange-700")
    } else {
      setTimeLeft(`${days}d${remainHours > 0 ? ` ${remainHours}h` : ""} left`)
      setColorClass("bg-gray-100 text-gray-600")
    }
  }

  useEffect(() => {
    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [deadline])

  if (!deadline) return null

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
      ⏱ {timeLeft}
    </span>
  )
}
