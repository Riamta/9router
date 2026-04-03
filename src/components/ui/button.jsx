import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary - Black solid
        default: "bg-black text-white shadow-md hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200",
        // Destructive - Red
        destructive: "bg-red-500 text-white shadow-md hover:bg-red-600",
        // Outline
        outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 dark:border-zinc-600 dark:bg-transparent dark:text-zinc-300 dark:hover:bg-zinc-800",
        // Secondary
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
        // Ghost
        ghost: "text-slate-600 hover:text-black hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800",
        // Link
        link: "text-slate-700 underline-offset-4 hover:underline dark:text-slate-300",
        // Blue accent
        blue: "bg-blue-500 text-white shadow-md hover:bg-blue-600",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-3 text-xs",
        lg: "h-10 px-5",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
