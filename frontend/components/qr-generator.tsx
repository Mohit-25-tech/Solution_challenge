"use client"
import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { assignmentAPI } from "@/lib/api"

export function QRGenerator({ assignmentId }: { assignmentId: number }) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await assignmentAPI.getQRData(assignmentId)
        setToken(data.token)
      } catch {
        setError("Could not generate QR code")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [assignmentId])

  if (loading) {
    return (
      <div className="w-44 h-44 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
        <span className="text-xs text-gray-400">Generating...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-44 h-44 border border-red-200 rounded-xl flex items-center justify-center">
        <p className="text-xs text-red-500 text-center px-3">{error}</p>
      </div>
    )
  }

  if (!token) return null

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <QRCodeSVG
          value={token}
          size={160}
          level="M"
          includeMargin={false}
        />
      </div>
      <p className="text-xs text-gray-500 text-center max-w-[180px] leading-relaxed">
        Volunteer scans this QR on arrival to confirm task completion
      </p>
      <p className="text-[10px] text-gray-400">Valid for 24 hours</p>
    </div>
  )
}
