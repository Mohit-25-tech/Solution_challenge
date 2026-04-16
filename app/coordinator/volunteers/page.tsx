'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Home, AlertCircle, TrendingUp, Settings, LogOut, Search, MapPin, Star, CheckCircle2 } from 'lucide-react';
import { mockVolunteers } from '@/lib/mock-data';

export default function VolunteersPage() {
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
            <Link href="/coordinator/requests" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
              <AlertCircle className="w-5 h-5" />
              Requests
            </Link>
            <Link href="/coordinator/volunteers" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground font-medium">
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
          <h1 className="text-2xl font-bold">Volunteer Network</h1>
          <span className="text-sm text-muted-foreground">{mockVolunteers.length} volunteers</span>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Search & Filter */}
          <div className="flex gap-3">
            <Input
              placeholder="Search volunteers by name or skill..."
              className="flex-1"
              icon={<Search className="w-4 h-4" />}
            />
            <Button variant="outline">Filter</Button>
          </div>

          {/* Volunteers Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockVolunteers.map((volunteer) => (
              <Card key={volunteer.id} className="p-4 hover:border-primary/50 transition cursor-pointer">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{volunteer.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {volunteer.location}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Reliability</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{volunteer.reliabilityScore}%</span>
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      </div>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${volunteer.reliabilityScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground">Skills ({volunteer.skills.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {volunteer.skills.slice(0, 2).map((skill) => (
                        <span key={skill} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          {skill}
                        </span>
                      ))}
                      {volunteer.skills.length > 2 && (
                        <span className="text-xs text-muted-foreground px-2 py-0.5">+{volunteer.skills.length - 2} more</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      {volunteer.tasksCompleted} completed
                    </span>
                    <span>{volunteer.availability}</span>
                  </div>

                  <Button className="w-full" variant="outline" size="sm">
                    View Profile
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
