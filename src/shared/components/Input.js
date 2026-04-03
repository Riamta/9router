"use client";

import { cn } from "@/lib/utils";

// Colorful Input component
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
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <span className="material-symbols-outlined text-lg">{icon}</span>
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full rounded-lg border bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500",
            "focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-zinc-800",
            "transition-all duration-200",
            // iOS zoom fix
            "text-[16px] sm:text-sm",
            icon && "pl-10",
            error 
              ? "border-red-300 focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.1)] dark:border-red-800" 
              : "border-slate-200 hover:border-slate-300 dark:border-zinc-700 dark:hover:border-zinc-600",
            inputClassName
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  );
}
