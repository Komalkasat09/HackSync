"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ChevronRight, Check, Zap, Crown } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import { API_ENDPOINTS } from "@/lib/config";
import SplashCursor from "@/components/SplashCursor";

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Simple token check without redirect
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    setChecking(false);
  }, []);

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden bg-background transition-colors">
      <SplashCursor />
      
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center z-20">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden shiny-blue-bg">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-70 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)' }} />
            <ShieldCheck className="text-white w-5 h-5 relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">SkillSphere</span>
        </Link>

        {/* Right Side Nav */}
        <div className="flex items-center gap-4">
          <ModeToggle />
          
          {!checking && (
            <>
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] hover:bg-foreground/10 text-foreground px-5 py-2 rounded-lg text-sm font-medium transition-all relative overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_0_15px_rgba(255,255,255,0.05),inset_0_0_15px_rgba(255,255,255,0.05)]"
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 pointer-events-none rounded-lg"
                    style={{
                      maskImage:
                        "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                    }}
                  />
                  <span className="relative z-10">Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-[var(--glass-bg)] hover:backdrop-blur-xl hover:border hover:border-[var(--glass-border)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_0_10px_rgba(255,255,255,0.05)]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] hover:bg-foreground/10 text-foreground px-5 py-2 rounded-lg text-sm font-medium transition-all relative overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_0_15px_rgba(255,255,255,0.05),inset_0_0_15px_rgba(255,255,255,0.05)]"
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 pointer-events-none rounded-lg"
                      style={{
                        maskImage:
                          "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                        WebkitMaskImage:
                          "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                      }}
                    />
                    <span className="relative z-10">Get API Key</span>
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 mt-[-50px]">
        
        {/* Badge with Shiny Blue */}
        <div className="mb-8 mt-24 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl text-foreground/70 text-xs font-medium relative overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_0_15px_rgba(255,255,255,0.08),inset_0_0_15px_rgba(255,255,255,0.08)]">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--shiny-blue-glow)]/10 via-transparent to-[var(--shiny-blue-glow)]/10 pointer-events-none rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent opacity-60 pointer-events-none rounded-full" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)' }} />
          <span className="relative z-10 w-1.5 h-1.5 rounded-full shiny-blue-bg" style={{ boxShadow: '0 0 8px var(--shiny-blue-glow), 0 0 12px var(--shiny-blue-glow-strong)' }}></span>
          <span className="relative z-10">AI-Powered Career Guidance Platform</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-6 max-w-5xl leading-[1.1] text-foreground">
          Your <span className="shiny-blue-text">AI Career</span> <br />
          <span className="shiny-blue-text">Companion</span> for <br />
          Success and <span className="shiny-blue-text">Growth</span>
        </h1>

        {/* Subtext */}
        <p className="text-base text-foreground/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          SkillSphere is an AI-powered career guidance platform that helps you discover ideal career paths, 
          build professional resumes, identify skill gaps, and ace your interviews with personalized AI coaching. 
          Transform your career journey with intelligent guidance every step of the way.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] hover:bg-foreground/10 text-foreground px-8 py-3.5 rounded-lg font-medium flex items-center gap-2 transition-all cursor-pointer relative overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_0_20px_rgba(255,255,255,0.1),inset_0_0_20px_rgba(255,255,255,0.08)]">
            <div
              className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent opacity-60 pointer-events-none rounded-lg"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
              }}
            />
            <ShieldCheck className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Try Career Assessment</span>
          </button>

          <Link
            href="/auth/signup"
            className="shiny-blue-bg text-white px-8 py-3.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all cursor-pointer relative overflow-hidden"
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-50 pointer-events-none rounded-lg"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
              }}
            />
            <ChevronRight className="w-4 h-4 relative z-10 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
            <span className="relative z-10 drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]">
              Get Started Free
            </span>
          </Link>
        </div>

        {/* Background Glow - Shiny Blue */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] -z-10 opacity-30 dark:opacity-20" style={{ background: 'radial-gradient(circle, var(--shiny-blue-glow-strong) 0%, transparent 70%)' }} />
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 relative z-10">
        <div className="container mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-foreground">
              Simple, transparent <span className="text-foreground/80">pricing</span>
            </h2>
            <p className="text-base text-foreground/50 max-w-2xl mx-auto">
              Choose the plan that fits your career goals. All plans include career recommendations, 
              resume building, learning guides, and interview preparation features.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto pt-4">
            
            {/* Free Plan */}
            <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl p-8 flex flex-col hover:border-foreground/30 transition-all relative overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_0_20px_rgba(255,255,255,0.05),inset_0_0_20px_rgba(255,255,255,0.05)]">
              {/* Shiny border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)' }} />
              {/* Gray gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-foreground/10 pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 shiny-blue-text" />
                  <h3 className="text-xl font-semibold text-foreground">Free</h3>
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">$0</span>
                  <span className="text-foreground/50 text-sm ml-1">/month</span>
                </div>
                <p className="text-sm text-foreground/50 mt-2">Perfect for getting started</p>
              </div>

              <ul className="flex-1 space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70"><strong>5 AI queries/month</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">1 career recommendation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">Basic resume builder</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">Skill gap analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">Interview tips</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">Community support</span>
                </li>
              </ul>

              <button className="w-full bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] hover:border-foreground/30 hover:bg-foreground/5 text-foreground px-6 py-3 rounded-lg font-medium transition-all cursor-pointer relative overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_0_15px_rgba(255,255,255,0.05),inset_0_0_15px_rgba(255,255,255,0.05)]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 pointer-events-none rounded-lg" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)' }} />
                <span className="relative z-10">Get Started</span>
              </button>
              </div>
            </div>

            {/* $20 Plan - Popular with Shiny Blue */}
            <div className="bg-[var(--glass-bg)] backdrop-blur-xl shiny-blue-border rounded-2xl p-8 flex flex-col relative hover:shadow-lg transition-all -mt-4">
              {/* Shiny border glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-60 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)' }} />
              {/* Shiny blue gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--shiny-blue-glow)]/10 via-transparent to-[var(--shiny-blue-glow)]/5 pointer-events-none rounded-2xl" />
              {/* Popular Badge with Shiny Blue */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                <span className="shiny-blue-bg text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-lg">
                  Most Popular
                </span>
              </div>

              <div className="relative z-10 flex flex-col h-full">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 shiny-blue-text" />
                  <h3 className="text-xl font-semibold text-foreground">Pro</h3>
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">$20</span>
                  <span className="text-foreground/50 text-sm ml-1">/month</span>
                </div>
                <p className="text-sm text-foreground/50 mt-2">For growing businesses</p>
              </div>

              <ul className="flex-1 space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70"><strong>Unlimited AI queries</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">Unlimited career recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70"><strong>AI resume optimization</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70"><strong>Personalized learning paths</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">Advanced skill gap analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">AI interview simulator</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">Industry insights & trends</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">Real-time job matching</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">Priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">Detailed career analytics</span>
                </li>
              </ul>

              <button className="w-full shiny-blue-bg text-white px-6 py-3 rounded-lg font-medium transition-all cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-50 pointer-events-none rounded-lg" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)' }} />
                <span className="relative z-10 drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]">Start Free Trial</span>
              </button>
              </div>
            </div>

            {/* $100 Plan */}
            <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl p-8 flex flex-col hover:border-foreground/30 transition-all relative overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_0_20px_rgba(255,255,255,0.05),inset_0_0_20px_rgba(255,255,255,0.05)]">
              {/* Shiny border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)' }} />
              {/* Gray gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-foreground/10 pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 shiny-blue-text" />
                  <h3 className="text-xl font-semibold text-foreground">Enterprise</h3>
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">$100</span>
                  <span className="text-foreground/50 text-sm ml-1">/month</span>
                </div>
                <p className="text-sm text-foreground/50 mt-2">For large organizations</p>
              </div>

              <ul className="flex-1 space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70"><strong>Custom team solutions</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">Unlimited everything</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">All career guidance features</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">Advanced AI coaching & mentorship</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">Team analytics dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">Custom career frameworks</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">White-label solutions</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">24/7 dedicated support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">SLA guarantee</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 shiny-blue-text shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">On-premise deployment</span>
                </li>
              </ul>

              <button className="w-full bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] hover:border-foreground/30 hover:bg-foreground/5 text-foreground px-6 py-3 rounded-lg font-medium transition-all cursor-pointer relative overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_0_15px_rgba(255,255,255,0.05),inset_0_0_15px_rgba(255,255,255,0.05)]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 pointer-events-none rounded-lg" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)' }} />
                <span className="relative z-10">Contact Sales</span>
              </button>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}