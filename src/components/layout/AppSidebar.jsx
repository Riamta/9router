"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Layers,
  BarChart3,
  Database,
  Settings,
  Terminal,
  Shield,
  Power,
  Globe,
  FileCode,
  Languages,
  Zap,
  Activity,
  Server,
  Sparkles,
  Cpu,
  Command
} from "lucide-react";

const navItems = [
  { href: "/dashboard/endpoint", label: "Endpoint", icon: Zap },
  { href: "/dashboard/providers", label: "Providers", icon: Database },
  { href: "/dashboard/models", label: "Models", icon: Cpu },
  { href: "/dashboard/combos", label: "Combos", icon: Layers },
  { href: "/dashboard/usage", label: "Usage", icon: BarChart3 },
  { href: "/dashboard/quota", label: "Quota", icon: Activity },
  { href: "/dashboard/mitm", label: "MITM", icon: Shield },
  { href: "/dashboard/cli-tools", label: "CLI Tools", icon: Terminal },
];

const systemItems = [
  { href: "/dashboard/proxy-pools", label: "Proxies", icon: Globe },
  { href: "/dashboard/profile", label: "Settings", icon: Settings },
];

export function AppSidebar({ onClose, className }) {
  const pathname = usePathname();
  const [showShutdownModal, setShowShutdownModal] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [enableTranslator, setEnableTranslator] = useState(false);
  const [version, setVersion] = useState("0.0.0");

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => { 
        if (data.enableTranslator) setEnableTranslator(true); 
      })
      .catch(() => {});
    
    fetch("/api/version")
      .then(res => res.json())
      .then(data => { 
        setVersion(data.currentVersion || "0.0.0");
        if (data.hasUpdate) setUpdateInfo(data); 
      })
      .catch(() => {});
  }, []);

  const isActive = (href) => {
    if (href === "/dashboard/endpoint") {
      return pathname === "/dashboard" || pathname.startsWith("/dashboard/endpoint");
    }
    return pathname.startsWith(href);
  };

  const handleShutdown = async () => {
    setIsShuttingDown(true);
    try {
      await fetch("/api/shutdown", { method: "POST" });
    } catch (e) {}
    setIsShuttingDown(false);
    setShowShutdownModal(false);
    setIsDisconnected(true);
  };

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                active
                  ? "bg-foreground text-background font-semibold shadow-md"
                  : "text-foreground/80 hover:text-foreground hover:bg-accent font-medium"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", active && "stroke-[2.5px]")} />
              <span className="text-sm tracking-wide">{item.label}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="lg:hidden bg-background border-border rounded-lg">
            {item.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <>
      <TooltipProvider delayDuration={0}>
        <div className={cn(
          "flex flex-col h-full w-56 bg-background border-r border-border",
          className
        )}>
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-foreground text-background shadow-lg shadow-foreground/20">
                <Command className="h-[18px] w-[18px] stroke-[2.5px]" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-black tracking-tight text-foreground">
                  9Router
                </h1>
                <span className="text-[11px] text-foreground/60 font-mono font-semibold">v{version}</span>
              </div>
            </Link>

            {/* Update */}
            {updateInfo && (
              <div className="mt-3 p-2.5 rounded-xl border border-border bg-accent">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-foreground" />
                  <span className="text-[11px] font-bold text-foreground">v{updateInfo.latestVersion}</span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-2 space-y-6 scrollbar-thin">
            {/* Main */}
            <div className="space-y-1 px-2">
              <p className="px-3 py-2 text-[11px] font-bold text-foreground/60 uppercase tracking-widest">
                Main
              </p>
              {navItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>

            {/* Tools */}
            {enableTranslator && (
              <div className="space-y-1 px-2">
                <p className="px-3 py-2 text-[11px] font-bold text-foreground/60 uppercase tracking-widest">
                  Tools
                </p>
                <NavItem item={{ href: "/dashboard/translator", label: "Translator", icon: Languages }} />
                <NavItem item={{ href: "/dashboard/console-log", label: "Console", icon: FileCode }} />
              </div>
            )}

            {/* System */}
            <div className="space-y-1 px-2">
              <p className="px-3 py-2 text-[11px] font-bold text-foreground/60 uppercase tracking-widest">
                System
              </p>
              {systemItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border space-y-3">
            <div className="flex items-center gap-2 px-2">
              <div className="h-2 w-2 rounded-full bg-foreground animate-pulse" />
              <span className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">Running</span>
            </div>

            <Button
              variant="outline"
              className="w-full h-9 text-xs font-semibold text-foreground/80 border-border bg-transparent hover:bg-foreground hover:text-background rounded-lg transition-colors tracking-wide"
              onClick={() => setShowShutdownModal(true)}
            >
              <Power className="h-4 w-4 mr-2" />
              SHUTDOWN
            </Button>
          </div>
        </div>
      </TooltipProvider>

      {/* Dialog */}
      <AlertDialog open={showShutdownModal} onOpenChange={setShowShutdownModal}>
        <AlertDialogContent className="bg-background border-border rounded-xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold tracking-wide">SHUTDOWN SERVER</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Stop the proxy server?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-8 text-xs rounded-lg bg-transparent border-border hover:bg-accent">
              CANCEL
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleShutdown}
              disabled={isShuttingDown}
              className="h-8 text-xs rounded-lg bg-foreground text-background hover:bg-foreground/90"
            >
              {isShuttingDown ? "STOPPING..." : "SHUTDOWN"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disconnected */}
      {isDisconnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="text-center p-8 border border-border rounded-xl max-w-xs">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-foreground text-background mx-auto mb-4">
              <Power className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-foreground mb-2 tracking-wide">DISCONNECTED</h2>
            <p className="text-xs text-muted-foreground mb-6">Server stopped</p>
            <Button 
              variant="outline" 
              onClick={() => globalThis.location.reload()}
              className="h-8 text-xs rounded-lg bg-transparent border-foreground text-foreground hover:bg-foreground hover:text-background"
            >
              RELOAD
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
