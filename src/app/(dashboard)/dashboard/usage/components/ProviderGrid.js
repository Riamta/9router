"use client";

import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import { AI_PROVIDERS } from "@/shared/constants/providers";
import { 
  Activity, 
  ArrowUp, 
  ArrowDown, 
  Clock,
  Zap,
  AlertCircle,
  CheckCircle2,
  TrendingUp
} from "lucide-react";

function getProviderConfig(providerId) {
  return AI_PROVIDERS[providerId] || { name: providerId, textIcon: "??" };
}

function getProviderImageUrl(providerId) {
  return `/providers/${providerId}.png`;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatCurrency(cost) {
  if (cost >= 1) return "$" + cost.toFixed(2);
  if (cost >= 0.01) return "$" + cost.toFixed(3);
  return "$" + cost.toFixed(4);
}

function timeAgo(timestamp) {
  if (!timestamp) return "Never";
  const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Provider Card Component
function ProviderCard({ provider, stats, isActive, isLast, hasError, activeCount = 0 }) {
  const config = getProviderConfig(provider.provider);
  const [imgError, setImgError] = useState(false);
  
  const totalTokens = (stats?.promptTokens || 0) + (stats?.completionTokens || 0);
  const cost = stats?.cost || 0;
  const requests = stats?.requests || 0;
  const lastUsed = stats?.lastUsed;

  return (
    <div className={cn(
      "group relative p-5 rounded-2xl border-2 transition-all duration-300",
      "hover:scale-[1.02]",
      isActive 
        ? "bg-foreground border-background text-background shadow-[0_0_40px_rgba(255,255,255,0.3)] z-10" 
        : hasError
          ? "bg-destructive/10 border-destructive text-foreground"
          : "bg-card border-border text-foreground hover:border-foreground/50"
    )}>
      {/* Glow effect for active */}
      {isActive && (
        <div className="absolute -inset-1 bg-foreground/20 rounded-2xl blur-xl -z-10 animate-pulse" />
      )}

      {/* Status indicator */}
      <div className="absolute top-4 right-4">
        {isActive ? (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-background opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-background" />
              </span>
              <span className="text-xs font-black uppercase tracking-widest">Live</span>
            </div>
            {activeCount > 0 && (
              <span className="text-[10px] font-bold text-background/70">
                {activeCount} active
              </span>
            )}
          </div>
        ) : hasError ? (
          <AlertCircle className="h-6 w-6 text-destructive" />
        ) : isLast ? (
          <Clock className="h-6 w-6 text-foreground/60" />
        ) : null}
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          isActive ? "bg-background/20" : "bg-accent"
        )}>
          {!imgError ? (
            <img 
              src={getProviderImageUrl(provider.provider)} 
              alt={config.name}
              className={cn("w-8 h-8 rounded object-contain", isActive && "invert")}
              onError={() => setImgError(true)}
            />
          ) : (
            <span className={cn(
              "text-lg font-black",
              isActive ? "text-background" : "text-foreground"
            )}>
              {config.textIcon || provider.provider?.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "text-base font-black tracking-wide truncate uppercase",
            isActive ? "text-background" : "text-foreground"
          )}>
            {config.name || provider.name || provider.provider}
          </h3>
          <p className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            isActive ? "text-background/70" : "text-foreground/60"
          )}>
            {provider.provider}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Requests */}
        <div className={cn(
          "p-3 rounded-xl",
          isActive ? "bg-background/10" : "bg-accent/50"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <Activity className={cn(
              "h-3.5 w-3.5",
              isActive ? "text-background/70" : "text-foreground/50"
            )} />
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              isActive ? "text-background/70" : "text-foreground/50"
            )}>
              Requests
            </span>
          </div>
          <p className={cn(
            "text-xl font-black tracking-tight",
            isActive ? "text-background" : "text-foreground"
          )}>
            {formatNumber(requests)}
          </p>
        </div>

        {/* Cost */}
        <div className={cn(
          "p-3 rounded-xl",
          isActive ? "bg-background/10" : "bg-accent/50"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className={cn(
              "h-3.5 w-3.5",
              isActive ? "text-background/70" : "text-foreground/50"
            )} />
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              isActive ? "text-background/70" : "text-foreground/50"
            )}>
              Cost
            </span>
          </div>
          <p className={cn(
            "text-xl font-black tracking-tight",
            isActive ? "text-background" : "text-foreground"
          )}>
            {formatCurrency(cost)}
          </p>
        </div>

        {/* Input Tokens */}
        <div className={cn(
          "p-3 rounded-xl",
          isActive ? "bg-background/10" : "bg-accent/50"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowUp className={cn(
              "h-3.5 w-3.5",
              isActive ? "text-background/70" : "text-foreground/50"
            )} />
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              isActive ? "text-background/70" : "text-foreground/50"
            )}>
              Input
            </span>
          </div>
          <p className={cn(
            "text-lg font-bold tracking-tight",
            isActive ? "text-background" : "text-foreground"
          )}>
            {formatNumber(stats?.promptTokens || 0)}
          </p>
        </div>

        {/* Output Tokens */}
        <div className={cn(
          "p-3 rounded-xl",
          isActive ? "bg-background/10" : "bg-accent/50"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowDown className={cn(
              "h-3.5 w-3.5",
              isActive ? "text-background/70" : "text-foreground/50"
            )} />
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              isActive ? "text-background/70" : "text-foreground/50"
            )}>
              Output
            </span>
          </div>
          <p className={cn(
            "text-lg font-bold tracking-tight",
            isActive ? "text-background" : "text-foreground"
          )}>
            {formatNumber(stats?.completionTokens || 0)}
          </p>
        </div>
      </div>

      {/* Footer */}
      {lastUsed && (
        <div className={cn(
          "mt-4 pt-4 border-t flex items-center justify-between",
          isActive 
            ? "border-background/20" 
            : hasError
              ? "border-destructive/20"
              : "border-border"
        )}>
          <span className={cn(
            "text-[10px] font-semibold uppercase tracking-wider",
            isActive ? "text-background/60" : "text-foreground/50"
          )}>
            Last Used
          </span>
          <span className={cn(
            "text-xs font-bold",
            isActive ? "text-background" : "text-foreground"
          )}>
            {timeAgo(lastUsed)}
          </span>
        </div>
      )}
    </div>
  );
}

ProviderCard.propTypes = {
  provider: PropTypes.object.isRequired,
  stats: PropTypes.object,
  isActive: PropTypes.bool,
  isLast: PropTypes.bool,
  hasError: PropTypes.bool,
  activeCount: PropTypes.number,
};

// Summary Stats Component
function SummaryStats({ providers, totalRequests, totalCost, totalTokens }) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="p-5 rounded-2xl border-2 border-border bg-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-foreground text-background">
            <Zap className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">
            Providers
          </span>
        </div>
        <p className="text-2xl font-black text-foreground">{providers.length}</p>
      </div>

      <div className="p-5 rounded-2xl border-2 border-border bg-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-foreground text-background">
            <Activity className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">
            Total Requests
          </span>
        </div>
        <p className="text-2xl font-black text-foreground">{formatNumber(totalRequests)}</p>
      </div>

      <div className="p-5 rounded-2xl border-2 border-border bg-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-foreground text-background">
            <TrendingUp className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">
            Total Cost
          </span>
        </div>
        <p className="text-2xl font-black text-foreground">{formatCurrency(totalCost)}</p>
      </div>

      <div className="p-5 rounded-2xl border-2 border-border bg-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-foreground text-background">
            <ArrowUp className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">
            Total Tokens
          </span>
        </div>
        <p className="text-2xl font-black text-foreground">{formatNumber(totalTokens)}</p>
      </div>
    </div>
  );
}

// Main Provider Grid Component
export default function ProviderGrid({ 
  providers = [], 
  providerStats = {}, 
  activeRequests = [], 
  lastProvider = "", 
  errorProvider = "" 
}) {
  const activeSet = useMemo(
    () => new Set(activeRequests.map((r) => r.provider?.toLowerCase()).filter(Boolean)),
    [activeRequests]
  );
  const lastSet = useMemo(() => new Set(lastProvider ? [lastProvider.toLowerCase()] : []), [lastProvider]);
  const errorSet = useMemo(() => new Set(errorProvider ? [errorProvider.toLowerCase()] : []), [errorProvider]);

  // Calculate totals
  const totals = useMemo(() => {
    let totalRequests = 0;
    let totalCost = 0;
    let totalTokens = 0;
    
    Object.values(providerStats).forEach((stats) => {
      totalRequests += stats?.requests || 0;
      totalCost += stats?.cost || 0;
      totalTokens += (stats?.promptTokens || 0) + (stats?.completionTokens || 0);
    });
    
    return { totalRequests, totalCost, totalTokens };
  }, [providerStats]);

  // Calculate active request count per provider
  const activeCountMap = useMemo(() => {
    const counts = {};
    activeRequests.forEach((r) => {
      const key = r.provider?.toLowerCase();
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [activeRequests]);

  // Sort: Active first, then by requests
  const sortedProviders = useMemo(() => {
    return [...providers].sort((a, b) => {
      const aActive = activeSet.has(a.provider?.toLowerCase());
      const bActive = activeSet.has(b.provider?.toLowerCase());
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      
      const aRequests = providerStats[a.provider]?.requests || 0;
      const bRequests = providerStats[b.provider]?.requests || 0;
      return bRequests - aRequests;
    });
  }, [providers, activeSet, providerStats]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <SummaryStats 
        providers={providers}
        {...totals}
      />

      {/* Provider Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedProviders.map((provider) => {
          const providerKey = provider.provider;
          const providerKeyLower = providerKey?.toLowerCase();
          const isActive = activeSet.has(providerKeyLower);
          const isLast = lastSet.has(providerKeyLower);
          const hasError = errorSet.has(providerKeyLower);
          const stats = providerStats[providerKey];
          const activeCount = activeCountMap[providerKeyLower] || 0;

          return (
            <ProviderCard
              key={providerKey}
              provider={provider}
              stats={stats}
              isActive={isActive}
              isLast={isLast}
              hasError={hasError}
              activeCount={activeCount}
            />
          );
        })}
      </div>

      {providers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-accent mb-4">
            <Activity className="h-8 w-8 text-foreground/40" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No Providers Active</h3>
          <p className="text-sm text-foreground/60 max-w-sm">
            Add providers to start tracking usage and costs.
          </p>
        </div>
      )}
    </div>
  );
}

ProviderGrid.propTypes = {
  providers: PropTypes.array,
  providerStats: PropTypes.object,
  activeRequests: PropTypes.array,
  lastProvider: PropTypes.string,
  errorProvider: PropTypes.string,
};
