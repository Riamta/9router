"use client";

import { cn } from "@/lib/utils";

export default function Card({
  children,
  title,
  subtitle,
  icon,
  action,
  padding = "md",
  hover = false,
  className,
  ...props
}) {
  const paddings = {
    none: "",
    xs: "p-4",
    sm: "p-5",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "bg-card text-card-foreground border border-border rounded-xl shadow-sm",
        hover && "hover:border-foreground/40 hover:shadow-lg hover:shadow-foreground/10 transition-all duration-300",
        paddings[padding],
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2.5 rounded-xl bg-foreground text-background shadow-md">
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-sm font-black tracking-wide text-foreground uppercase">{title}</h3>
              )}
              {subtitle && (
                <p className="text-xs font-semibold text-foreground/70">{subtitle}</p>
              )}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

Card.Section = function CardSection({ children, className, ...props }) {
  return (
    <div
      className={cn("p-5 rounded-xl border border-border bg-accent/50", className)}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Row = function CardRow({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "p-4 -mx-4 px-4 transition-colors rounded-lg",
        "border-b border-border last:border-b-0",
        "hover:bg-accent/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

Card.ListItem = function CardListItem({ children, actions, className, ...props }) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between p-4 -mx-4 px-4 rounded-lg",
        "border-b border-border last:border-b-0",
        "hover:bg-accent/50",
        "transition-colors",
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {actions && (
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {actions}
        </div>
      )}
    </div>
  );
};
