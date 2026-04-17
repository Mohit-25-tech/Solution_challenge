'use client'

import { Sidebar } from '@/components/sidebar'
import { ProtectedLayout } from '@/components/protected-layout'

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedLayout requiredRole="volunteer">
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedLayout>
  )
}
