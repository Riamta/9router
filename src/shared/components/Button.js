"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Button variants with solid colors (no gradients)
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium transition-all duration-200 rounded-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary - Black solid (đen đơn giản)
        default: "bg-black text-white shadow-md hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200",
        
        // Destructive - Red solid
        destructive: "bg-red-500 text-white shadow-md hover:bg-red-600",
        
        // Outline - đen
        outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 dark:border-zinc-600 dark:bg-transparent dark:text-zinc-300 dark:hover:bg-zinc-800",
        
        // Secondary - Light gray
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
        
        // Ghost - Transparent
        ghost: "text-slate-600 hover:text-black hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800",
        
        // Link - đen
        link: "text-slate-700 underline-offset-4 hover:underline dark:text-slate-300",
        
        // Blue variant - cho accent
        blue: "bg-blue-500 text-white shadow-md hover:bg-blue-600",
        
        // Legacy aliases
        danger: "bg-red-500 text-white shadow-md hover:bg-red-600",
        primary: "bg-black text-white shadow-md hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-3 text-xs",
        md: "h-10 px-5",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({ className, variant = "default", size = "default", asChild = false, icon, iconRight, loading, fullWidth, children, ...props }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        buttonVariants({ variant, size, className }),
        fullWidth && "w-full"
      )}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-sm">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="material-symbols-outlined text-sm">{iconRight}</span>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
export default Button;
