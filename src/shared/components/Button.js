"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold tracking-wide transition-all duration-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background shadow-lg shadow-foreground/20 hover:bg-foreground/90 hover:shadow-foreground/30",
        destructive: "bg-destructive text-white shadow-lg shadow-destructive/30 hover:bg-destructive/90",
        outline: "border-2 border-foreground/30 bg-transparent text-foreground hover:bg-foreground hover:text-background hover:border-foreground",
        secondary: "bg-accent text-foreground hover:bg-accent/80",
        ghost: "hover:bg-accent text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        // Legacy aliases
        danger: "bg-destructive text-white shadow-lg shadow-destructive/30 hover:bg-destructive/90",
        primary: "bg-foreground text-background shadow-lg shadow-foreground/20 hover:bg-foreground/90 hover:shadow-foreground/30",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-5",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
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
        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="material-symbols-outlined text-[16px]">{iconRight}</span>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
export default Button;
