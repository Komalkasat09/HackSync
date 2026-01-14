"use client"

import * as React from "react"
import { CheckCircle2, X, AlertCircle, Info, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  message: string
  type?: "success" | "error" | "info" | "loading" | "warning"
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export function Toast({ message, type = "success", isVisible, onClose, duration = 3000 }: ToastProps) {
  React.useEffect(() => {
    // Don't auto-close loading toasts
    if (isVisible && duration > 0 && type !== "loading") {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose, type])

  if (!isVisible) return null

  const bgColor = 
    type === "success" ? "bg-green-500" :
    type === "error" ? "bg-red-500" :
    type === "warning" ? "bg-yellow-500" :
    type === "loading" ? "bg-blue-500" :
    "bg-blue-500"

  const Icon = 
    type === "success" ? CheckCircle2 :
    type === "error" ? AlertCircle :
    type === "warning" ? AlertCircle :
    type === "loading" ? Loader2 :
    Info

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in-0">
      <div className={cn(
        "flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl text-white min-w-[320px] max-w-[90vw]",
        bgColor
      )}>
        {type === "loading" ? (
          <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />
        ) : (
          <Icon className="w-5 h-5 flex-shrink-0" />
        )}
        <p className="flex-1 text-sm font-medium">{message}</p>
        {type !== "loading" && (
          <button
            onClick={onClose}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Close toast"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

