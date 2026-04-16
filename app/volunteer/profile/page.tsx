'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, MapPin, Clock, Award, Edit2, Save, X, LogOut, Settings, Home, Briefcase, Star, Heart, Check } from 'lucide-react';
import { mockVolunteers } from '@/lib/mock-data';

export default function VolunteerProfilePage() {
  const [currentVolunteer] = useState(mockVolunteers[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: currentVolunteer.name,
    email: currentVolunteer.email,
    phone: currentVolunteer.phone,
    location: currentVolunteer.location,
    availability: currentVolunteer.availability,
  });

  const handleSave = () => {
    setIsEditing(false);
  };

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
            <Link href="/volunteer/portal" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            <Link href="/volunteer/available" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
              <Briefcase className="w-5 h-5" />
              Available Tasks
            </Link>
            <Link href="/volunteer/profile" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground font-medium">
              <Award className="w-5 h-5" />
              My Profile
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
          <h1 className="text-2xl font-bold">My Profile</h1>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} size="sm">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Profile Header */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  {isEditing ? (
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="text-2xl font-bold h-auto py-1"
                    />
                  ) : (
                    <h2 className="text-3xl font-bold">{currentVolunteer.name}</h2>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Reliability Score</p>
                  <p className="text-3xl font-bold text-primary flex items-center gap-2">
                    {currentVolunteer.reliabilityScore}
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Tasks Completed</p>
                  <p className="text-3xl font-bold text-secondary">{currentVolunteer.tasksCompleted}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Skills</p>
                  <p className="text-3xl font-bold text-accent">{currentVolunteer.skills.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="font-semibold text-green-700">Active</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Contact Information
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground">{currentVolunteer.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground">{currentVolunteer.phone}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Location & Availability */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Availability & Location</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                {isEditing ? (
                  <Input
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground">{currentVolunteer.location}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Availability
                </label>
                {isEditing ? (
                  <select
                    value={profile.availability}
                    onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
                  >
                    <option>Weekdays</option>
                    <option>Weekends</option>
                    <option>Full-time</option>
                    <option>Evenings</option>
                    <option>Flexible</option>
                  </select>
                ) : (
                  <p className="text-foreground">{currentVolunteer.availability}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Skills & Certifications */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Skills & Certifications</h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {currentVolunteer.skills.map((skill) => (
                  <span key={skill} className="px-4 py-2 rounded-lg bg-primary/20 text-primary font-medium text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {skill}
                  </span>
                ))}
              </div>
              {isEditing && (
                <Button variant="outline" className="w-full">
                  + Add Skills
                </Button>
              )}
            </div>
          </Card>

          {/* Activity History */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {[
                { date: '2024-05-12', action: 'Completed Medical Assistance Request' },
                { date: '2024-05-08', action: 'Applied to Community Center Renovation' },
                { date: '2024-05-05', action: 'Completed Food Distribution Coordination' },
                { date: '2024-04-28', action: 'Updated profile skills' },
                { date: '2024-04-20', action: 'Completed Youth Mentorship Program' },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-start justify-between border-b border-border pb-3 last:border-0">
                  <p className="text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.date}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Stats & Metrics */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: 'Total Hours',
                value: '156',
                icon: Clock,
              },
              {
                label: 'People Helped',
                value: '340+',
                icon: Users,
              },
              {
                label: 'Avg Rating',
                value: '4.9/5',
                icon: Star,
              },
            ].map((stat, idx) => (
              <Card key={idx} className="p-4 space-y-2 text-center">
                <stat.icon className="w-6 h-6 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
