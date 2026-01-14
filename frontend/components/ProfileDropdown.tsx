"use client"

import * as React from "react"
import { User, Settings, CreditCard, TrendingUp, Coins, ChevronRight } from "lucide-react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"

export function ProfileDropdown() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg hover:bg-foreground/5 transition-colors">
        <User className="w-5 h-5 text-foreground/70" />
      </button>
    );
  }

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button className="p-2 rounded-lg hover:bg-foreground/5 transition-colors">
          <User className="w-5 h-5 text-foreground/70" />
        </button>
      </DropdownMenuPrimitive.Trigger>
      
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl p-1 text-foreground shadow-xl relative"
        >
          {/* Gray gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-foreground/10 pointer-events-none rounded-xl" />
          <DropdownMenuPrimitive.Item
            className="relative flex select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-foreground/5 focus:bg-foreground/5 cursor-pointer z-10"
          >
            <User className="w-4 h-4" />
            <span>Your Account</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </DropdownMenuPrimitive.Item>
          
          <DropdownMenuPrimitive.Item
            className="relative flex select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-foreground/5 focus:bg-foreground/5 cursor-pointer z-10"
          >
            <CreditCard className="w-4 h-4" />
            <span>Plan</span>
            <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
          </DropdownMenuPrimitive.Item>
          
          <DropdownMenuPrimitive.Item
            className="relative flex select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-foreground/5 focus:bg-foreground/5 cursor-pointer z-10"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Upgrade</span>
            <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
          </DropdownMenuPrimitive.Item>
          
          <DropdownMenuPrimitive.Item
            className="relative flex select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-foreground/5 focus:bg-foreground/5 cursor-pointer z-10"
          >
            <Coins className="w-4 h-4" />
            <span>Coins</span>
            <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
          </DropdownMenuPrimitive.Item>
          
          <DropdownMenuPrimitive.Separator className="my-1 h-px bg-[var(--glass-border)] relative z-10" />
          
          <DropdownMenuPrimitive.Item
            className="relative flex select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-foreground/5 focus:bg-foreground/5 cursor-pointer z-10"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </DropdownMenuPrimitive.Item>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}

