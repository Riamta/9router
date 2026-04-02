"use client";

import { cn } from "@/lib/utils";

export default function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  hint,
  icon,
  disabled = false,
  required = false,
  className,
  inputClassName,
  ...props
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label className="text-sm font-bold text-foreground uppercase tracking-wider">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-foreground/50">
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            "flex h-11 w-full rounded-lg border-2 border-input bg-transparent px-4 py-2 text-sm font-medium",
            "placeholder:text-foreground/40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:border-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200",
            // iOS zoom fix
            "text-[16px] sm:text-sm",
            icon && "pl-11",
            error && "border-destructive focus-visible:ring-destructive",
            inputClassName
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs font-semibold text-destructive flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs font-medium text-foreground/60">{hint}</p>
      )}
    </div>
  );
}
