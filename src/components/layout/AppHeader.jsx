"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
  Zap,
  Database,
  Layers,
  BarChart3,
  Activity,
  Shield,
  Terminal,
  Settings,
  Monitor,
  Server,
  Command,
  Cpu
} from "lucide-react";

const getPageInfo = (pathname) => {
  if (!pathname) return { title: "", description: "" };

  const routes = {
    "/dashboard/providers": { title: "Providers", description: "Manage AI providers", icon: Database },
    "/dashboard/models": { title: "Model Library", description: "Browse all AI models", icon: Cpu },
    "/dashboard/combos": { title: "Combos", description: "Model combos", icon: Layers },
    "/dashboard/usage": { title: "Usage", description: "Monitor usage", icon: BarChart3 },
    "/dashboard/quota": { title: "Quota", description: "Track quota", icon: Activity },
    "/dashboard/mitm": { title: "MITM", description: "Proxy settings", icon: Shield },
    "/dashboard/cli-tools": { title: "CLI", description: "CLI tools", icon: Terminal },
    "/dashboard/proxy-pools": { title: "Proxies", description: "Proxy pools", icon: Server },
    "/dashboard/endpoint": { title: "Endpoint", description: "API config", icon: Zap },
    "/dashboard/profile": { title: "Settings", description: "Preferences", icon: Settings },
    "/dashboard/console-log": { title: "Console", description: "Logs", icon: Monitor },
    "/dashboard": { title: "Dashboard", description: "Overview", icon: Zap },
  };

  for (const [route, info] of Object.entries(routes)) {
    if (pathname.startsWith(route)) return info;
  }

  return { title: "", description: "" };
};

export function AppHeader({ onMenuClick, className }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState("en");

  const pageInfo = useMemo(() => getPageInfo(pathname), [pathname]);
  const { title, description, icon: Icon } = pageInfo;

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
        "flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-30",
        className
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 hover:bg-accent"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="hidden lg:flex flex-col">
          {title && (
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4 text-foreground stroke-[2.5px]" />}
              <h1 className="text-xs font-black tracking-[0.2em] uppercase text-foreground">{title}</h1>
            </div>
          )}
          {description && (
            <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">{description}</p>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-accent"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 hover:bg-accent rounded-lg">
              <Avatar className="h-6 w-6 rounded-md">
                <AvatarFallback className="bg-foreground text-background text-[10px] font-bold rounded-md">
                  9R
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52 bg-background border-border rounded-xl shadow-2xl" align="end" forceMount>
            <DropdownMenuLabel className="font-normal py-3">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-black text-foreground uppercase tracking-widest">Admin</p>
                <p className="text-[11px] font-semibold text-foreground/60">9Router</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild className="text-xs font-semibold hover:bg-accent cursor-pointer rounded-lg py-2.5">
              <Link href="/dashboard/profile">
                <Settings className="mr-2 h-4 w-4" />
                SETTINGS
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive font-semibold hover:bg-destructive/10 hover:text-destructive text-xs cursor-pointer rounded-lg py-2.5"
            >
              <LogOut className="mr-2 h-4 w-4" />
              LOGOUT
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
