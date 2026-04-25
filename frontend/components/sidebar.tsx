'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, FileText, Users, Zap, Briefcase, LogOut, Menu, X, BarChart2, User } from 'lucide-react'
import { useState } from 'react'

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  const ngoLinks = [
    { href: '/coordinator/dashboard', label: 'Command Center', icon: LayoutDashboard },
    { href: '/coordinator/requests', label: 'Requests', icon: FileText },
    { href: '/coordinator/volunteers', label: 'Volunteers', icon: Users },
    { href: '/coordinator/analytics', label: 'Analytics', icon: BarChart2 },
  ]

  const volunteerLinks = [
    { href: '/volunteer/portal', label: 'My Missions', icon: Briefcase },
    { href: '/volunteer/available', label: 'Available Work', icon: Zap },
    { href: '/volunteer/profile', label: 'Profile', icon: User },
  ]

  const links = user.role === 'ngo' ? ngoLinks : volunteerLinks
  // Generate initials from name
  const initials = (user.name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      {/* Mobile Toggle */}
      <div className="fixed top-4 left-4 md:hidden z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg bg-slate-800 text-white hover:bg-slate-700"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-[260px] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static`}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                >
                  <span className="text-white text-xs font-bold">VM</span>
                </div>
                <div>
                  <h1 className="text-base font-bold leading-tight text-white">
                    VolunteerMatch
                  </h1>
                  <p className="text-[11px] text-white/40 capitalize">
                    {user.role === 'ngo' ? 'Coordinator' : 'Volunteer'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname.startsWith(link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 group ${
                    isActive
                      ? 'bg-blue-600/20 text-white'
                      : 'text-white/40 hover:text-white hover:pl-5'
                  }`}
                >
                  {/* Active left accent bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1 bottom-1 w-1 bg-blue-500 rounded-r-full" />
                  )}
                  <Icon className={`h-[18px] w-[18px] transition-colors ${isActive ? 'text-blue-400' : 'text-white/40 group-hover:text-white/80'}`} />
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-white/10 p-4 space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-[11px] text-white/40 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout()
                window.location.href = '/'
              }}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
