"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import {
  Menu,
  LogOut,
  Moon,
  Sun,
  Command,
  ChevronRight,
} from "lucide-react";

// Breadcrumb mapping
const getBreadcrumbs = (pathname) => {
  const paths = pathname.split("/").filter(Boolean);
  
  if (paths.length === 0 || (paths.length === 1 && paths[0] === "dashboard")) {
    return [
      { label: "9Router", href: "/dashboard", icon: Command },
    ];
  }

  const crumbs = [{ label: "9Router", href: "/dashboard", icon: Command }];
  
  const routeLabels = {
    endpoint: "Endpoint",
    providers: "Providers",
    models: "Models",
    combos: "Combos",
    usage: "Usage",
    quota: "Quota",
    mitm: "MITM",
    "cli-tools": "CLI Tools",
    "proxy-pools": "Proxies",
    profile: "Settings",
    "console-log": "Console",
    translator: "Translator",
  };

  const lastSegment = paths[paths.length - 1];
  const label = routeLabels[lastSegment] || lastSegment;
  
  crumbs.push({
    label,
    href: pathname,
    active: true,
  });

  return crumbs;
};

export function AppHeader({ onMenuClick, className }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const breadcrumbs = useMemo(() => getBreadcrumbs(pathname), [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  return (
    <header
      className={cn(
        "flex items-center justify-between px-4 h-11 bg-white border-b border-slate-200 sticky top-0 z-30 dark:bg-zinc-900 dark:border-zinc-800",
        className
      )}
    >
      {/* Left - Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 -ml-1 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </Button>

        {/* Breadcrumbs with colors */}
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => {
            const Icon = crumb.icon;
            const isLast = index === breadcrumbs.length - 1;
            
            return (
              <div key={crumb.href} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 mx-1" />
                )}
                <Link
                  href={crumb.href}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-200",
                    isLast
                      ? "font-semibold text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/30"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-zinc-800/50"
                  )}
                >
                  {Icon && <Icon className={cn("h-3.5 w-3.5", isLast && "text-blue-500")} />}
                  <span>{crumb.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Right - Actions with colorful accents */}
      <div className="flex items-center gap-1">
        {/* Theme toggle with color */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" />
        </Button>

        {/* User menu with colorful avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 ml-1 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            >
              <Avatar className="h-7 w-7 rounded-lg ring-2 ring-blue-100 dark:ring-blue-900/50">
                <AvatarFallback className="bg-blue-500 text-white text-[10px] font-bold rounded-lg">
                  9R
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-48 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal py-3 px-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Admin
                </p>
                <p className="text-xs text-slate-400">9Router</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-zinc-800" />
            <DropdownMenuItem
              asChild
              className="text-sm cursor-pointer rounded-lg py-2 mx-1 hover:bg-blue-50 text-slate-700 dark:hover:bg-blue-950/30 dark:text-slate-300"
            >
              <Link href="/dashboard/profile">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-zinc-800" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-500 text-sm cursor-pointer rounded-lg py-2 mx-1 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
