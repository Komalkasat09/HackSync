"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Target,        // Career Recommender
  FileText,      // Resume Builder
  BookOpen,      // Learning Guide
  Briefcase,     // Interview Prep
  LogOut, 
  ShieldCheck,
  User,
  UserCircle,    // Your Profile
  Sparkles,      // AI Resume Builder
  GitBranch      // AI Roadmap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const menuItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, shortText: "Home" },
  { name: "Your Profile", href: "/dashboard/your-profile", icon: UserCircle, shortText: "Profile" },
  { name: "AI Resume Builder", href: "/dashboard/ai-resume", icon: Sparkles, shortText: "AI Resume" },
  { name: "Learning Roadmap", href: "/dashboard/roadmap", icon: GitBranch, shortText: "Roadmap" },
  { name: "Career Recommender", href: "/dashboard/career", icon: Target, shortText: "Career" },
  { name: "Interview Prep", href: "/dashboard/interview", icon: Briefcase, shortText: "Interview" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 });
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Calculate active item index and position
  useEffect(() => {
    const activeIndex = menuItems.findIndex(item => pathname === item.href);
    if (activeIndex !== -1 && itemRefs.current[activeIndex]) {
      const activeItem = itemRefs.current[activeIndex];
      const nav = navRef.current;
      if (activeItem && nav) {
        // Use requestAnimationFrame to ensure DOM is fully rendered
        requestAnimationFrame(() => {
          const navRect = nav.getBoundingClientRect();
          const itemRect = activeItem.getBoundingClientRect();
          // Calculate position relative to nav container
          const topOffset = itemRect.top - navRect.top;
          setIndicatorStyle({
            top: topOffset,
            height: itemRect.height,
          });
        });
      }
    } else {
      // Hide indicator if no menu item matches (e.g., on profile page)
      setIndicatorStyle({
        top: 0,
        height: 0,
      });
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  return (
    <>
      <aside className="w-72 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out">
        
        {/* LOGO */}
        <Link href="/" className="h-20 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-foreground rounded-lg">
              <ShieldCheck className="w-5 h-5 text-background" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground">SkillSphere</span>
          </div>
        </Link>

        {/* NAV */}
        <nav ref={navRef} className="flex-1 py-6 flex flex-col gap-1.5 px-4 relative">
          {/* Sliding Indicator */}
          <div
            className="absolute left-4 right-4 rounded-lg bg-foreground transition-all duration-500 ease-in-out pointer-events-none"
            style={{
              top: `${indicatorStyle.top}px`,
              height: `${indicatorStyle.height}px`,
            }}
          />
          
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => { itemRefs.current[index] = el; }}
                className={cn(
                  "group flex items-center gap-3 px-4 py-4 rounded-lg text-sm font-medium relative z-10",
                  "transition-all duration-300 ease-in-out",
                  isActive 
                    ? "text-background" 
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                {/* Hover glass effect */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-lg bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out pointer-events-none" />
                )}
                
                <item.icon className={cn(
                  "w-6 h-6 shrink-0 relative z-10 transition-all duration-300 ease-in-out",
                  isActive 
                    ? "text-background" 
                    : "text-foreground/50 group-hover:text-foreground"
                )} />
                <div className="flex flex-col relative z-10">
                  <span className="transition-all duration-300 ease-in-out">{item.name}</span>
                  <span className="text-xs opacity-70 mt-0.5">{item.shortText}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* PROFILE & LOGOUT */}
        <div className="p-4 border-t border-border space-y-2">
          {/* Profile Button */}
          <Link 
            href="/dashboard/profile"
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]",
              pathname === "/dashboard/profile"
                ? "bg-foreground text-background"
                : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
            )}
          >
            <User className="w-5 h-5 shrink-0" />
            <span>Profile</span>
          </Link>
          
          {/* Logout Button */}
          <button 
            onClick={() => setShowLogoutDialog(true)}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogout}
        title="Sign Out"
        description="Are you sure you want to sign out? You will need to log in again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
      />
    </>
  );
}