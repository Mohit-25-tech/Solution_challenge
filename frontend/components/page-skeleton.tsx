"use client"

export function PageSkeleton({ rows = 5, variant = "card" }: { rows?: number; variant?: "card" | "stat" | "row" }) {
  const heights: Record<string, string> = {
    card: "h-24",
    stat: "h-16",
    row: "h-12",
  }

  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`${heights[variant]} shimmer-gradient rounded-2xl`}
          style={{
            opacity: 1 - i * 0.1,
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center animate-fadeInUp">
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-2xl">
        ⚠️
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">Something went wrong</p>
        <p className="text-xs text-gray-500 max-w-xs">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="text-sm text-blue-600 border border-blue-200 px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-all duration-150 font-medium active:scale-95"
      >
        Try again
      </button>
    </div>
  )
}
