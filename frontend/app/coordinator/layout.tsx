'use client'

import { Sidebar } from '@/components/sidebar'
import { ProtectedLayout } from '@/components/protected-layout'
import { NotificationBell } from '@/components/notification-bell'

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedLayout requiredRole="ngo">
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-end h-14 px-6 border-b border-border bg-background/95 backdrop-blur shrink-0">
            <NotificationBell />
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedLayout>
  )
}
