import * as React from "react"
import { cn } from "@/lib/utils"

const TooltipProvider = ({ children }) => {
  return <>{children}</>
}

const Tooltip = ({ children }) => {
  return <div className="relative inline-flex group">{children}</div>
}

const TooltipTrigger = React.forwardRef(({ className, children, asChild, ...props }, ref) => {
  if (asChild) {
    const child = React.Children.only(children)
    return React.cloneElement(child, {
      ref,
      className: cn(child.props.className),
      ...props,
    })
  }
  return (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef(({ className, side = "bottom", children, ...props }, ref) => {
  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 -mt-1 border-t-0 border-r-0",
    bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-0 border-l-0",
    left: "left-full top-1/2 -translate-y-1/2 -ml-1 border-l-0 border-b-0",
    right: "right-full top-1/2 -translate-y-1/2 -mr-1 border-r-0 border-t-0",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md whitespace-nowrap pointer-events-none",
        "opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200",
        sideClasses[side],
        className
      )}
      {...props}
    >
      {children}
      <div
        className={cn(
          "absolute w-2 h-2 bg-popover border rotate-45",
          arrowClasses[side]
        )}
      />
    </div>
  )
})
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
