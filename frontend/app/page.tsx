'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { dashboardAPI } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Target, Zap, BarChart3, Heart, Globe, Loader2 } from 'lucide-react';

export default function LandingPage() {
  const { logout, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    total_volunteers: 127,
    completed_requests: 34,
    active_requests: 12,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardAPI.getStats();
        if (data) {
          setStats({
            total_volunteers: data.total_volunteers || 0,
            completed_requests: data.completed_requests || 0,
            active_requests: data.active_requests || 0,
          });
        }
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    };
    fetchStats();
  }, []);

  // Force logout on landing page
  useEffect(() => {
    logout();
  }, [logout]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                V
              </div>
              <span className="text-lg font-semibold">VolunteerMatch</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition">
                Features
              </a>
              <a href="#impact" className="text-sm text-muted-foreground hover:text-foreground transition">
                Impact
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/signup">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Smart Volunteer <span className="text-primary">Coordination</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Intelligently match volunteers with disaster relief requests using our advanced matching engine. No skill mismatches. No wasted time.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {/* Buttons removed as requested */}
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section id="impact" className="border-y border-border bg-card/50 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.total_volunteers}</div>
              <p className="text-sm text-muted-foreground mt-2">Registered Volunteers</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.completed_requests}</div>
              <p className="text-sm text-muted-foreground mt-2">Requests Fulfilled</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.active_requests}</div>
              <p className="text-sm text-muted-foreground mt-2">Active Live Relief Efforts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why VolunteerMatch?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="p-6">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Intelligent Matching</h3>
              <p className="text-sm text-muted-foreground">
                Our AI engine matches volunteers by skills, proximity, urgency, and reliability. Get the right person for every task.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6">
              <Globe className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Real-Time Coordination</h3>
              <p className="text-sm text-muted-foreground">
                Instant matching and assignment. No waiting. No manual coordination. Just pure efficiency.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6">
              <Heart className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Reliability Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Every volunteer's reliability score improves with completed tasks, ensuring better future matches.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-6">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Dual Interfaces</h3>
              <p className="text-sm text-muted-foreground">
                Separate experiences for NGOs and Volunteers. Each interface perfectly designed for its role.
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="p-6">
              <Target className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Geographic Filtering</h3>
              <p className="text-sm text-muted-foreground">
                25km radius matching ensures volunteers can actually reach the task location in time.
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="p-6">
              <BarChart3 className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Interactive dashboards and heatmaps show resource allocation and impact in real-time.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-card py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl font-bold">Ready to Transform Volunteer Coordination?</h2>
          <p className="text-muted-foreground">
            Join hundreds of NGOs and volunteers using VolunteerMatch for smarter resource allocation.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">
                Start For Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2026 VolunteerMatch. Built for impact.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
