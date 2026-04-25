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
      <div className="flex h-screen bg-gray-50/50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative">
          <div className="absolute top-4 right-6 z-50">
            <NotificationBell />
          </div>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedLayout>
  )
}
