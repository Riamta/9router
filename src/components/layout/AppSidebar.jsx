"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Cpu,
  Command,
  LayoutDashboard,
  Key,
} from "lucide-react";

// Navigation - simple black text
const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/providers", label: "Providers", icon: Database },
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
  { href: "/dashboard/models", label: "Models", icon: Cpu },
  { href: "/dashboard/combos", label: "Combos", icon: Layers },
];

const analyticsNavItems = [
  { href: "/dashboard/usage", label: "Usage", icon: BarChart3 },
  { href: "/dashboard/quota", label: "Quota", icon: Activity },
];

const toolsNavItems = [
  { href: "/dashboard/mitm", label: "MITM", icon: Shield },
  { href: "/dashboard/cli-tools", label: "CLI Tools", icon: Terminal },
];

const systemNavItems = [
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
      .then((res) => res.json())
      .then((data) => {
        if (data.enableTranslator) setEnableTranslator(true);
      })
      .catch(() => {});

    fetch("/api/version")
      .then((res) => res.json())
      .then((data) => {
        setVersion(data.currentVersion || "0.0.0");
        if (data.hasUpdate) setUpdateInfo(data);
      })
      .catch(() => {});
  }, []);

  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "/dashboard/endpoint") {
      return pathname.startsWith("/dashboard/endpoint");
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

  const NavItem = ({ item, nested = false }) => {
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
                "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
                active
                  ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-300"
                  : "text-slate-700 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-zinc-800",
                nested && "ml-6"
              )}
            >
              <Icon className={cn(
                "h-4 w-4",
                active ? "text-blue-500" : "text-slate-500"
              )} />
              <span>{item.label}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="lg:hidden">
            {item.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const SectionHeader = ({ title, count }) => (
    <div className="flex items-center justify-between px-2 py-1.5">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        {title}
      </span>
      {count !== undefined && (
        <span className="text-[11px] text-slate-400">{count}</span>
      )}
    </div>
  );

  return (
    <>
      <TooltipProvider delayDuration={0}>
        <div
          className={cn(
            "flex flex-col h-full w-56 bg-white border-r border-slate-200 dark:bg-zinc-900 dark:border-zinc-800",
            className
          )}
        >
          {/* Logo - simple */}
          <div className="p-3 border-b border-slate-200 dark:border-zinc-800">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-2 py-2"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-black text-white dark:bg-white dark:text-black">
                <Command className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-black dark:text-white">
                Api2K
              </span>
            </Link>
          </div>

          {/* Update notification */}
          {updateInfo && (
            <div className="mx-3 mb-2 px-3 py-2 rounded-md bg-slate-100 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-black dark:bg-white" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  v{updateInfo.latestVersion} available
                </span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-2 space-y-4 scrollbar-thin">
            {/* Main Section */}
            <div className="px-2">
              <SectionHeader title="Core" count={mainNavItems.length} />
              <div className="mt-1 space-y-0.5">
                {mainNavItems.map((item) => (
                  <NavItem key={item.href} item={item} />
                ))}
              </div>
            </div>

            {/* Analytics Section */}
            <div className="px-2">
              <SectionHeader title="Analytics" count={analyticsNavItems.length} />
              <div className="mt-1 space-y-0.5">
                {analyticsNavItems.map((item) => (
                  <NavItem key={item.href} item={item} />
                ))}
              </div>
            </div>

            {/* Tools Section */}
            <div className="px-2">
              <SectionHeader title="Tools" />
              <div className="mt-1 space-y-0.5">
                {toolsNavItems.map((item) => (
                  <NavItem key={item.href} item={item} />
                ))}
                <NavItem item={{ href: "/dashboard/console-log", label: "Console", icon: FileCode }} />
                {enableTranslator && (
                  <NavItem item={{ href: "/dashboard/translator", label: "Translator", icon: Languages }} />
                )}
              </div>
            </div>

            {/* System Section */}
            <div className="px-2">
              <SectionHeader title="System" />
              <div className="mt-1 space-y-0.5">
                {systemNavItems.map((item) => (
                  <NavItem key={item.href} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-zinc-800 space-y-2">
            {/* Status indicator */}
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Running</span>
              </div>
              <span className="text-xs text-slate-400">v{version}</span>
            </div>

            {/* Shutdown button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 justify-start px-2"
              onClick={() => setShowShutdownModal(true)}
            >
              <Power className="h-3.5 w-3.5 mr-2" />
              Shutdown
            </Button>
          </div>
        </div>
      </TooltipProvider>

      {/* Shutdown Dialog */}
      <AlertDialog open={showShutdownModal} onOpenChange={setShowShutdownModal}>
        <AlertDialogContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 rounded-lg max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Shutdown Server</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Stop the proxy server? This will disconnect all active connections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-8 text-xs rounded-md bg-transparent border-slate-200 hover:bg-slate-100 text-slate-700 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-slate-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleShutdown}
              disabled={isShuttingDown}
              className="h-8 text-xs rounded-md bg-black text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200"
            >
              {isShuttingDown ? "Stopping..." : "Shutdown"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disconnected Screen */}
      {isDisconnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-zinc-950">
          <div className="text-center p-8 border border-slate-200 dark:border-zinc-800 rounded-lg max-w-xs bg-white dark:bg-zinc-900">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-slate-100 dark:bg-zinc-800 mx-auto mb-4">
              <Power className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            </div>
            <h2 className="text-sm font-semibold mb-1">Disconnected</h2>
            <p className="text-xs text-slate-500 mb-4">Server stopped</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => globalThis.location.reload()}
              className="h-8 text-xs rounded-md border-black text-black hover:bg-slate-100 dark:border-white dark:text-white dark:hover:bg-zinc-800"
            >
              Reload
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
