"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ModeToggle } from "@/components/ModeToggle";
import { API_ENDPOINTS } from "@/lib/config";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      try {
        const res = await fetch(API_ENDPOINTS.AUTH.ME, {
          headers: { 
            "Authorization": `Bearer ${token}` 
          },
        });
        
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        router.push("/auth/login");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      
      {/* 1. FIXED SIDEBAR */}
      <Sidebar />

      {/* 2. MAIN CONTENT AREA (Pushed right by 72px/18rem) */}
      <main className="flex-1 ml-72 flex flex-col">
        
        {/* TOP HEADER */}
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card sticky top-0 z-30">
          <h2 className="font-medium text-foreground/90 text-sm tracking-tight">Dashboard</h2>
          <div className="flex items-center gap-3">
            <ModeToggle />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-8 overflow-y-auto h-[calc(100vh-4rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}