'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, FileText, Users, Zap, Briefcase, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  const ngoLinks = [
    { href: '/coordinator/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/coordinator/requests', label: 'Requests', icon: FileText },
    { href: '/coordinator/volunteers', label: 'Volunteers', icon: Users },
    { href: '/coordinator/analytics', label: 'Analytics', icon: Zap },
  ]

  const volunteerLinks = [
    { href: '/volunteer/portal', label: 'My Tasks', icon: Briefcase },
    { href: '/volunteer/available', label: 'Available Work', icon: Users },
    { href: '/volunteer/profile', label: 'Profile', icon: LayoutDashboard },
  ]

  const links = user.role === 'ngo' ? ngoLinks : volunteerLinks
  const isDarkBg = true

  return (
    <>
      {/* Mobile Toggle */}
      <div className="fixed top-4 left-4 md:hidden z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static border-r border-border bg-card`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                V
              </div>
              <div>
                <h1 className="text-lg font-semibold">VolunteerMatch</h1>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname.startsWith(link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-border p-4 space-y-4">
            <div className="px-4 py-2">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => {
                logout()
                window.location.href = '/'
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
