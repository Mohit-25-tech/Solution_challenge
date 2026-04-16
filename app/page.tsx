'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Target, Zap, BarChart3, Heart, Globe } from 'lucide-react';

export default function LandingPage() {
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
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition">
                Pricing
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
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
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Connect Volunteers with Impact
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Intelligent matching connects skilled volunteers with critical needs. Manage missions, track impact, and build stronger communities.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start for Free
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Watch Demo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Join 500+ organizations managing 10,000+ volunteers</p>
            </div>
            <div className="relative h-80 sm:h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl border border-border flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="flex justify-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <div className="w-16 h-16 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <Target className="w-8 h-8 text-secondary" />
                  </div>
                </div>
                <p className="text-sm font-medium text-muted-foreground">AI-Powered Matching</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold">Powerful Features for Modern Volunteering</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to coordinate volunteers, match skills, and maximize impact
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Users,
                  title: 'Smart Matching',
                  description: 'AI matches volunteers with perfect fit opportunities based on skills and availability',
                },
                {
                  icon: BarChart3,
                  title: 'Real-time Analytics',
                  description: 'Track impact metrics, volunteer performance, and mission outcomes instantly',
                },
                {
                  icon: Zap,
                  title: 'Instant Coordination',
                  description: 'Manage requests, assignments, and check-ins from a unified dashboard',
                },
                {
                  icon: Target,
                  title: 'Skill Tracking',
                  description: 'Build volunteer profiles with specialized skills and certifications',
                },
                {
                  icon: Heart,
                  title: 'Impact Reporting',
                  description: 'Showcase your organization&apos;s mission results to stakeholders and donors',
                },
                {
                  icon: Globe,
                  title: 'Multi-location Support',
                  description: 'Coordinate volunteers across regions with location-aware assignments',
                },
              ].map((feature, idx) => (
                <Card key={idx} className="p-6 hover:border-primary/50 transition-colors">
                  <div className="space-y-3">
                    <feature.icon className="w-8 h-8 text-primary" />
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-20 sm:py-28 bg-muted/40 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold">Real Impact, Real Numbers</h2>
              <p className="text-lg text-muted-foreground">Organizations using VolunteerMatch have transformed their operations</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { number: '10,000+', label: 'Active Volunteers' },
                { number: '500+', label: 'Organizations' },
                { number: '50,000+', label: 'Lives Helped' },
                { number: '95%', label: 'Match Success Rate' },
              ].map((stat, idx) => (
                <Card key={idx} className="p-8 text-center bg-background">
                  <p className="text-4xl font-bold text-primary mb-2">{stat.number}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 p-8 sm:p-12 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold">Ready to Transform Your Volunteer Program?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join leading organizations in connecting skilled volunteers with critical needs
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link href="/signup">
                <Button size="lg">
                  Create Free Account
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/40 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-4 mb-8">
            <div className="space-y-3">
              <p className="font-semibold">Product</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition">Security</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="font-semibold">Company</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">About</a></li>
                <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="font-semibold">Resources</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Docs</a></li>
                <li><a href="#" className="hover:text-foreground transition">API</a></li>
                <li><a href="#" className="hover:text-foreground transition">Help</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="font-semibold">Legal</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">© 2024 VolunteerMatch. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition">Twitter</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition">LinkedIn</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
