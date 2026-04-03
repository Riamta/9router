"use client";

import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Badge variants with solid colors (no gradients)
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1.5 transition-all duration-150",
  {
    variants: {
      variant: {
        // Standard
        default: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300",
        
        primary: "bg-blue-500 text-white",
        
        secondary: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300",
        
        outline: "border border-slate-200 text-slate-600 bg-white dark:border-zinc-700 dark:bg-transparent dark:text-zinc-400",
        
        ghost: "text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
        
        // Status variants - Soft pastel
        success: "bg-green-100 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
        
        warning: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
        
        error: "bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
        
        info: "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
        
        // Workflow status
        backlog: "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800",
        
        todo: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
        
        "in-progress": "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800",
        
        done: "bg-green-100 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
        
        canceled: "bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
        
        // Priority
        low: "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
        
        medium: "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
        
        high: "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
        
        urgent: "bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  icon,
  className,
}) {
  // Solid color dots (no shadows/glows)
  const dotColors = {
    default: "bg-slate-400",
    primary: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    backlog: "bg-purple-500",
    todo: "bg-amber-500",
    "in-progress": "bg-yellow-500",
    done: "bg-green-500",
    canceled: "bg-red-500",
    low: "bg-slate-400",
    medium: "bg-blue-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  };

  return (
    <span className={cn(badgeVariants({ variant, size }), className)}>
      {dot && (
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            dotColors[variant] || dotColors.default
          )}
        />
      )}
      {icon && <span className="material-symbols-outlined text-xs">{icon}</span>}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
export default Badge;
