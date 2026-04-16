'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, Home, Users, TrendingUp, Settings, LogOut, Plus, Search, MapPin, Clock } from 'lucide-react';
import { mockRequests } from '@/lib/mock-data';

const urgencyColors = {
  critical: 'bg-red-500/10 text-red-700 border-red-200',
  high: 'bg-orange-500/10 text-orange-700 border-orange-200',
  medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  low: 'bg-green-500/10 text-green-700 border-green-200',
};

const statusColors = {
  open: 'bg-blue-500/10 text-blue-700',
  'in-progress': 'bg-purple-500/10 text-purple-700',
  completed: 'bg-green-500/10 text-green-700',
};

export default function RequestsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border hidden md:block">
        <div className="p-6 space-y-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
              V
            </div>
            <span className="font-semibold text-sidebar-foreground">VolunteerMatch</span>
          </div>

          <nav className="space-y-2">
            <Link href="/coordinator/dashboard" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            <Link href="/coordinator/requests" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground font-medium">
              <AlertCircle className="w-5 h-5" />
              Requests
            </Link>
            <Link href="/coordinator/volunteers" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
              <Users className="w-5 h-5" />
              Volunteers
            </Link>
            <Link href="/coordinator/analytics" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
              <TrendingUp className="w-5 h-5" />
              Analytics
            </Link>
          </nav>

          <div className="pt-8 border-t border-sidebar-border space-y-2">
            <Link href="#" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <Link href="/login" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
              <LogOut className="w-5 h-5" />
              Logout
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">All Requests</h1>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Search & Filter */}
          <div className="flex gap-3">
            <Input
              placeholder="Search requests..."
              className="flex-1"
              icon={<Search className="w-4 h-4" />}
            />
            <Button variant="outline">Filter</Button>
          </div>

          {/* Requests List */}
          <div className="space-y-3">
            {mockRequests.map((req) => (
              <Card key={req.id} className="p-4 hover:border-primary/50 transition cursor-pointer">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-semibold">{req.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {req.location}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${urgencyColors[req.urgency]}`}>
                        {req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[req.status]}`}>
                        {req.status === 'in-progress' ? 'In Progress' : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {req.volunteersAssigned}/{req.volunteersNeeded} assigned
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due: {req.deadline}
                      </span>
                    </div>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(req.volunteersAssigned / req.volunteersNeeded) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
