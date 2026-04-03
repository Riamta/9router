"use client";

import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { AI_PROVIDERS } from "@/shared/constants/providers";

function getProviderConfig(providerId) {
  return AI_PROVIDERS[providerId] || { name: providerId };
}

function getProviderImageUrl(providerId) {
  return `/providers/${providerId}.png`;
}

function fmtTokens(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function ProviderCard({ provider, active, last, error, stats }) {
  const [imgError, setImgError] = useState(false);
  const config = getProviderConfig(provider.provider);
  const label =
    (config.name !== provider.provider ? config.name : null) ||
    provider.name ||
    provider.provider;
  const imageUrl = getProviderImageUrl(provider.provider);
  const textIcon =
    config.textIcon || (provider.provider || "?").slice(0, 2).toUpperCase();

  let borderClass = "border-border";
  let bgClass = "bg-card";
  let textClass = "text-foreground";
  let mutedClass = "text-text-muted";
  let iconBgClass = "bg-accent";
  let iconImgClass = "";

  if (active) {
    borderClass = "border-foreground";
    bgClass = "bg-foreground";
    textClass = "text-background";
    mutedClass = "text-background/60";
    iconBgClass = "bg-background/20";
    iconImgClass = "invert";
  } else if (error) {
    borderClass = "border-red-500/60";
  } else if (last) {
    textClass = "text-foreground/70";
    mutedClass = "text-text-muted/70";
  }

  const promptTokens = stats?.promptTokens || 0;
  const completionTokens = stats?.completionTokens || 0;
  const hasStats = promptTokens > 0 || completionTokens > 0;

  return (
    <div
      className={`
        flex flex-col gap-1.5 px-3 py-2 rounded-xl border-2
        transition-all duration-300
        ${bgClass} ${borderClass} ${textClass}
        ${active ? "shadow-lg shadow-foreground/20" : ""}
        ${!active ? "hover:border-foreground/40" : ""}
      `}
    >
      {/* Top row: icon + name + status dot */}
      <div className="flex items-center gap-2.5">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconBgClass}`}
        >
          {!imgError ? (
            <img
              src={imageUrl}
              alt={label}
              className={`w-4 h-4 rounded object-contain ${iconImgClass}`}
              onError={() => setImgError(true)}
            />
          ) : (
            <span
              className={`text-xs font-bold ${active ? "text-background" : "text-foreground"}`}
            >
              {textIcon}
            </span>
          )}
        </div>

        <span className="text-sm font-bold tracking-wide truncate max-w-[90px]">
          {label}
        </span>

        {active && (
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-background opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-background" />
          </span>
        )}
        {error && !active && (
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 shrink-0 bg-red-500" />
        )}
      </div>

      {/* Token stats */}
      {hasStats && (
        <div className={`flex items-center gap-2 text-xs ${mutedClass}`}>
          <span className="flex items-center gap-0.5">
            <span className="opacity-60">↑</span>
            <span className="font-medium">{fmtTokens(promptTokens)}</span>
          </span>
          <span className="flex items-center gap-0.5">
            <span className="opacity-60">↓</span>
            <span className="font-medium">{fmtTokens(completionTokens)}</span>
          </span>
        </div>
      )}
    </div>
  );
}

ProviderCard.propTypes = {
  provider: PropTypes.object.isRequired,
  active: PropTypes.bool,
  last: PropTypes.bool,
  error: PropTypes.bool,
  stats: PropTypes.object,
};

export default function ProviderTopology({
  providers = [],
  activeRequests = [],
  lastProvider = "",
  errorProvider = "",
  byProvider = {},
}) {
  const activeSet = useMemo(
    () =>
      new Set(
        activeRequests.map((r) => r.provider?.toLowerCase()).filter(Boolean)
      ),
    [activeRequests]
  );
  const lastKey = lastProvider?.toLowerCase() || "";
  const errorKey = errorProvider?.toLowerCase() || "";

  // Ensure Gemini CLI is always included
  const allProviders = useMemo(() => {
    const hasGeminiCli = providers.some(
      (p) => p.provider?.toLowerCase() === "gemini-cli"
    );
    return hasGeminiCli
      ? providers
      : [...providers, { provider: "gemini-cli", name: "Gemini CLI" }];
  }, [providers]);

  // Sort: active first, then error, then last, then rest
  const sorted = useMemo(() => {
    return [...allProviders].sort((a, b) => {
      const aId = a.provider?.toLowerCase();
      const bId = b.provider?.toLowerCase();
      const score = (id) =>
        activeSet.has(id) ? 3 :
        errorKey === id ? 2 :
        lastKey === id ? 1 : 0;
      return score(bId) - score(aId);
    });
  }, [allProviders, activeSet, lastKey, errorKey]);

  const activeCount = activeSet.size;

  return (
    <div className="w-full bg-card rounded-2xl border-2 border-border p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background">
          <img src="/favicon.svg" alt="9Router" className="w-5 h-5 invert" />
          <span className="text-sm font-black tracking-widest uppercase">
            9Router
          </span>
          {activeCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-md bg-background text-foreground text-xs font-black">
              {activeCount}
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted">
          {allProviders.length} provider{allProviders.length !== 1 ? "s" : ""}{" "}
          connected
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {sorted.map((p) => {
          const id = p.provider?.toLowerCase();
          const active = activeSet.has(id);
          const error = !active && errorKey === id;
          const last = !active && !error && lastKey === id;

          // Match byProvider key (may be exact or case-insensitive)
          const statsKey =
            Object.keys(byProvider).find(
              (k) => k.toLowerCase() === id
            ) || p.provider;

          return (
            <ProviderCard
              key={p.provider}
              provider={p}
              active={active}
              last={last}
              error={error}
              stats={byProvider[statsKey]}
            />
          );
        })}
      </div>
    </div>
  );
}

ProviderTopology.propTypes = {
  providers: PropTypes.array,
  activeRequests: PropTypes.array,
  lastProvider: PropTypes.string,
  errorProvider: PropTypes.string,
  byProvider: PropTypes.object,
};
