"use client"
// ⚠️ IMPORTANT: Never import this component with a static import in Next.js pages.
// Always use Next.js dynamic() with ssr: false:
//
//   import dynamic from "next/dynamic"
//   const QRScanner = dynamic(
//     () => import("@/components/qr-scanner").then(m => ({ default: m.QRScanner })),
//     { ssr: false, loading: () => <div>Loading camera...</div> }
//   )
//
// Reason: html5-qrcode accesses `document` and `navigator` at module load time.
// Static imports will crash the Next.js build with:
//   ReferenceError: document is not defined

import { useEffect, useRef, useState } from "react"
import { assignmentAPI } from "@/lib/api"

export function QRScanner({
  onSuccess,
}: {
  onSuccess?: (result: {
    volunteer_name: string
    request_title: string
    completed_at: string
  }) => void
}) {
  const [status, setStatus] = useState<"idle" | "scanning" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const scannerRef = useRef<unknown>(null)

  useEffect(() => {
    let mounted = true

    async function startScanner() {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode")
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 220, height: 220 } },
          false
        )
        scannerRef.current = scanner

        scanner.render(
          async (decodedText: string) => {
            if (!mounted || status === "success") return
            setStatus("scanning")

            try {
              const result = await assignmentAPI.verifyQR(decodedText)
              if (result.success) {
                if (!mounted) return
                setStatus("success")
                setMessage(
                  `✅ ${result.volunteer_name} checked in for "${result.request_title}"`
                )
                onSuccess?.(result)

                // Fire confetti
                try {
                  const confetti = (await import("canvas-confetti")).default
                  confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                  })
                } catch {
                  // Confetti is optional
                }
              }
            } catch (err: unknown) {
              if (!mounted) return
              setStatus("error")
              setMessage((err as Error).message || "Invalid or expired QR code")
            }
          },
          () => {
            // Scan error (no QR found in frame) — silent
          }
        )
      } catch (err) {
        console.error("[QRScanner] Failed to start:", err)
      }
    }

    startScanner()

    return () => {
      mounted = false
      if (scannerRef.current) {
        try {
          ;(scannerRef.current as { clear?: () => void }).clear?.()
        } catch {
          // Cleanup can throw if scanner already stopped
        }
      }
    }
  }, [])

  const handleRetry = () => {
    setStatus("idle")
    setMessage("")
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      {/* Camera viewport */}
      <div
        id="qr-reader"
        className={`w-full rounded-xl overflow-hidden border-2 transition-colors ${
          status === "success"
            ? "border-green-300"
            : status === "error"
            ? "border-red-300"
            : "border-gray-200"
        }`}
      />

      {/* Status messages */}
      {status === "success" && (
        <div className="w-full px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 text-center">
          {message}
        </div>
      )}
      {status === "error" && (
        <div className="w-full flex flex-col items-center gap-2">
          <div className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 text-center">
            {message}
          </div>
          <button
            onClick={handleRetry}
            className="text-xs text-blue-600 underline"
          >
            Try again
          </button>
        </div>
      )}
      {status === "idle" && (
        <p className="text-xs text-gray-400 text-center">
          Point your camera at the volunteer's QR code
        </p>
      )}
      {status === "scanning" && (
        <p className="text-xs text-blue-600 text-center animate-pulse">
          Verifying...
        </p>
      )}
    </div>
  )
}
