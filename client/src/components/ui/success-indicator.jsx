import * as React from "react"
import { useSuccessIndicator } from "./use-success-indicator"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function SuccessIndicator() {
  const { isVisible, message } = useSuccessIndicator()

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto bg-green-500 dark:bg-green-600 text-white rounded-lg shadow-2xl p-6 sm:p-8",
          "flex flex-col items-center justify-center gap-3 sm:gap-4",
          "transition-all duration-300 ease-in-out",
          "animate-in fade-in-0 zoom-in-95",
          "min-w-[200px] sm:min-w-[280px]"
        )}
      >
        <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 transition-all duration-300 animate-in zoom-in-95" />
        <p className="text-base sm:text-lg font-semibold text-center">
          {message}
        </p>
      </div>
    </div>
  )
}

