"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import Card from "@/shared/components/Card";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";
import Badge from "@/shared/components/Badge";
import { CardSkeleton } from "@/shared/components";

export default function ModelsPage() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [providers, setProviders] = useState([]);
  
  // Custom prices state (provider -> model -> price)
  const [customPrices, setCustomPrices] = useState({});

  // Sort state
  const [sortField, setSortField] = useState(null); // "name" | "input" | "output" | "context" | "provider" | "usage"
  const [sortDirection, setSortDirection] = useState("asc"); // "asc" | "desc"

  // Usage data per model
  const [usageByModel, setUsageByModel] = useState({});

  // Edit modal state
  const [editingModel, setEditingModel] = useState(null);
  const [editInputPrice, setEditInputPrice] = useState("");
  const [editOutputPrice, setEditOutputPrice] = useState("");

  // Load custom prices from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("api2k-custom-prices");
    if (saved) {
      try {
        setCustomPrices(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse custom prices:", e);
      }
    }
  }, []);

  // Save custom prices to localStorage
  const saveCustomPrices = (prices) => {
    setCustomPrices(prices);
    localStorage.setItem("api2k-custom-prices", JSON.stringify(prices));
  };

  useEffect(() => {
    fetchModels();
    fetchUsageData();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      setModels(data.models || []);

      // Extract unique providers
      const uniqueProviders = [...new Set(data.models?.map(m => m.provider) || [])];
      setProviders(uniqueProviders);
    } catch (error) {
      console.error("Failed to fetch models:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageData = async () => {
    try {
      const res = await fetch("/api/usage/history");
      const data = await res.json();
      if (data.byModel) {
        // Build a map: model_id -> { requests, provider }
        const usageMap = {};
        for (const [key, val] of Object.entries(data.byModel)) {
          const rawModel = val.rawModel || key;
          const provider = val.provider || "";
          // Accumulate by rawModel (same model across providers)
          const mapKey = `${provider}/${rawModel}`;
          if (!usageMap[mapKey]) {
            usageMap[mapKey] = { requests: 0 };
          }
          usageMap[mapKey].requests += val.requests || 0;

          // Also accumulate by rawModel alone for fallback matching
          if (!usageMap[rawModel]) {
            usageMap[rawModel] = { requests: 0 };
          }
          usageMap[rawModel].requests += val.requests || 0;
        }
        setUsageByModel(usageMap);
      }
    } catch (error) {
      console.error("Failed to fetch usage data:", error);
    }
  };

  // Get usage count for a model
  const getUsageCount = (model) => {
    // Try exact match first: provider/model_id
    const exactKey = `${model.provider}/${model.id}`;
    if (usageByModel[exactKey]) return usageByModel[exactKey].requests;
    // Fallback: just model id
    if (usageByModel[model.id]) return usageByModel[model.id].requests;
    return 0;
  };

  // Get effective price (custom or default)
  const getPrice = (model, type) => {
    const key = `${model.provider}/${model.id}`;
    const custom = customPrices[key];
    if (custom && custom[type] !== undefined) {
      return custom[type];
    }
    return model.pricing?.[type] || 0;
  };

  const filteredModels = useMemo(() => {
    let result = models.filter((model) => {
      const matchesSearch =
        model.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProvider = selectedProvider === "all" || model.provider === selectedProvider;

      return matchesSearch && matchesProvider;
    });

    // Sort
    if (sortField) {
      result = [...result].sort((a, b) => {
        let valA, valB;
        switch (sortField) {
          case "name":
            valA = (a.id || "").toLowerCase();
            valB = (b.id || "").toLowerCase();
            return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
          case "input":
            valA = getPrice(a, "input");
            valB = getPrice(b, "input");
            break;
          case "output":
            valA = getPrice(a, "output");
            valB = getPrice(b, "output");
            break;
          case "context":
            valA = typeof a.contextWindow === "number" ? a.contextWindow : 0;
            valB = typeof b.contextWindow === "number" ? b.contextWindow : 0;
            break;
          case "provider":
            valA = (a.provider || "").toLowerCase();
            valB = (b.provider || "").toLowerCase();
            return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
          case "usage":
            valA = getUsageCount(a);
            valB = getUsageCount(b);
            break;
          default:
            return 0;
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }
        return 0;
      });
    }

    return result;
  }, [models, searchQuery, selectedProvider, sortField, sortDirection, usageByModel, customPrices]);

  // Toggle sort on column click
  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        // Third click: clear sort
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort icon — minimal dot indicator instead of ugly arrows
  const SortIndicator = ({ field }) => {
    if (sortField !== field) return null;
    return (
      <span className={cn(
        "inline-block w-1 h-1 rounded-full ml-1",
        sortDirection === "asc" ? "bg-primary" : "bg-primary"
      )} />
    );
  };

  // Column header component — clean, clickable, no arrow clutter
  const ColHeader = ({ field, children, align = "left" }) => (
    <button
      onClick={() => handleSort(field)}
      className={cn(
        "flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors select-none",
        align === "center" && "justify-center",
        align === "right" && "justify-end",
        sortField === field
          ? "text-text-main"
          : "text-text-muted hover:text-text-main/70"
      )}
    >
      <span>{children}</span>
      <SortIndicator field={field} />
      {sortField === field && (
        <span className="text-[9px] opacity-60">
          {sortDirection === "asc" ? "↑" : "↓"}
        </span>
      )}
    </button>
  );

  const formatPrice = (price) => {
    if (!price || price === 0) return "Free";
    return `$${price}/1M`;
  };

  const openEditModal = (model) => {
    setEditingModel(model);
    setEditInputPrice(getPrice(model, "input").toString());
    setEditOutputPrice(getPrice(model, "output").toString());
  };

  const closeEditModal = () => {
    setEditingModel(null);
    setEditInputPrice("");
    setEditOutputPrice("");
  };

  const savePrice = () => {
    if (!editingModel) return;
    
    const key = `${editingModel.provider}/${editingModel.id}`;
    const newPrices = {
      ...customPrices,
      [key]: {
        input: parseFloat(editInputPrice) || 0,
        output: parseFloat(editOutputPrice) || 0,
      }
    };
    
    saveCustomPrices(newPrices);
    closeEditModal();
  };

  const resetPrice = () => {
    if (!editingModel) return;
    
    const key = `${editingModel.provider}/${editingModel.id}`;
    const newPrices = { ...customPrices };
    delete newPrices[key];
    
    saveCustomPrices(newPrices);
    closeEditModal();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Filter inline */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Models</h1>
          <p className="text-sm text-text-muted mt-1">
            {models.length} models across {providers.length} providers
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06]">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-md transition-all",
                viewMode === "list"
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-text-main"
                  : "text-text-muted hover:text-text-main"
              )}
            >
              <span className="material-symbols-outlined text-[16px]">view_list</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-md transition-all",
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-text-main"
                  : "text-text-muted hover:text-text-main"
              )}
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search + Provider filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            icon="search"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="h-10 px-3 rounded-lg border border-border bg-transparent text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        >
          <option value="all">All Providers</option>
          {providers.map((provider) => (
            <option key={provider} value={provider}>{provider}</option>
          ))}
        </select>
      </div>

      {/* Result count + sort indicator — always rendered to hold space */}
      <div className="flex items-center justify-between h-5">
        {!loading && (
          <>
            <p className="text-xs text-text-muted">
              {filteredModels.length === 0
                ? "No results"
                : filteredModels.length === models.length
                  ? `${models.length} models`
                  : `${filteredModels.length} of ${models.length} models`
              }
            </p>
            {sortField && (
              <button
                onClick={() => { setSortField(null); setSortDirection("asc"); }}
                className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-main transition-colors"
              >
                <span>Sorted by {sortField} {sortDirection === "asc" ? "↑" : "↓"}</span>
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Models Grid/List — stable min-height prevents layout jump */}
      <div className="min-h-[420px]">
        {loading ? (
        <div className="flex flex-col gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black/[0.04] dark:bg-white/[0.06] mb-3">
            <span className="material-symbols-outlined text-[20px] text-text-muted">search_off</span>
          </div>
          <p className="text-sm font-medium text-text-main mb-1">No models found</p>
          <p className="text-xs text-text-muted">
            Try a different search term or filter.
          </p>
        </div>
      ) : (
        <>
          {/* List View Container */}
          {viewMode === "list" ? (
            <Card padding="none" className="overflow-hidden border border-border">
              {/* Table Header — sticky */}
              <div className="grid grid-cols-[2.5fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_48px] gap-3 px-5 py-2.5 border-b border-border bg-black/[0.02] dark:bg-white/[0.02]">
                <ColHeader field="name">Model</ColHeader>
                <ColHeader field="provider" align="center">Provider</ColHeader>
                <ColHeader field="usage" align="center">Usage</ColHeader>
                <ColHeader field="input" align="center">Input</ColHeader>
                <ColHeader field="output" align="center">Output</ColHeader>
                <ColHeader field="context" align="center">Context</ColHeader>
                <div />
              </div>
              {/* Table Rows — scrollable, stable height */}
              <div className="flex flex-col overflow-y-auto max-h-[calc(100vh-320px)]">
                {filteredModels.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    viewMode={viewMode}
                    formatPrice={formatPrice}
                    getPrice={getPrice}
                    onEdit={openEditModal}
                    hasCustomPrice={!!customPrices[`${model.provider}/${model.id}`]}
                    usageCount={getUsageCount(model)}
                  />
                ))}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  viewMode={viewMode}
                  formatPrice={formatPrice}
                  getPrice={getPrice}
                  onEdit={openEditModal}
                  hasCustomPrice={!!customPrices[`${model.provider}/${model.id}`]}
                  usageCount={getUsageCount(model)}
                />
              ))}
            </div>
          )}
        </>
      )}
      </div>

      {/* Edit Price Modal */}
      {editingModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 relative">
            <button
              onClick={closeEditModal}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
            
            <h3 className="text-lg font-bold text-text-main mb-1">
              Custom Pricing
            </h3>
            <p className="text-sm text-text-muted mb-6">
              {editingModel.provider}/{editingModel.id}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 block">
                  Input Price ($/1M tokens)
                </label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={editInputPrice}
                  onChange={(e) => setEditInputPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 block">
                  Output Price ($/1M tokens)
                </label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={editOutputPrice}
                  onChange={(e) => setEditOutputPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={resetPrice}
              >
                Reset
              </Button>
              <Button
                className="flex-1"
                onClick={savePrice}
              >
                Save
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ModelCard({ model, viewMode, formatPrice, getPrice, onEdit, hasCustomPrice, usageCount }) {
  const capabilities = [
    model.capabilities?.streaming && "Streaming",
    model.capabilities?.functionCalling && "Functions",
    model.capabilities?.vision && "Vision",
    model.capabilities?.json && "JSON",
    model.capabilities?.tools && "Tools",
  ].filter(Boolean);

  const inputPrice = getPrice(model, "input");
  const outputPrice = getPrice(model, "output");

  const formatUsageCount = (count) => {
    if (count === 0) return "—";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (viewMode === "list") {
    // Usage bar width ratio (max 100%)
    const maxUsage = 100; // will be capped visually
    const barWidth = usageCount > 0 ? Math.min(Math.max((usageCount / maxUsage) * 100, 8), 100) : 0;

    return (
      <div className="grid grid-cols-[2.5fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_48px] gap-3 px-5 py-3 items-center border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors group">
        {/* Model Name + Custom badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] shrink-0">
            <span className="material-symbols-outlined text-[16px] text-text-muted">smart_toy</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-text-main truncate">{model.id}</span>
              {hasCustomPrice && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  Custom
                </span>
              )}
            </div>
            {model.name && model.name !== model.id && (
              <p className="text-[11px] text-text-muted truncate">{model.name}</p>
            )}
          </div>
        </div>

        {/* Provider */}
        <div className="flex justify-center">
          <span className="text-[11px] font-medium text-text-muted bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 rounded-full truncate max-w-full">
            {model.provider}
          </span>
        </div>

        {/* Usage — mini bar */}
        <div className="flex flex-col items-center gap-1">
          <span className={cn(
            "text-[12px] font-semibold tabular-nums",
            usageCount > 0 ? "text-text-main" : "text-text-muted/50"
          )}>
            {formatUsageCount(usageCount)}
          </span>
          {usageCount > 0 && (
            <div className="w-full max-w-[48px] h-[3px] rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          )}
        </div>

        {/* Input price */}
        <div className="text-center">
          <span className={cn(
            "text-[12px] tabular-nums",
            inputPrice > 0 ? "font-semibold text-text-main" : "text-text-muted/60"
          )}>
            {formatPrice(inputPrice)}
          </span>
        </div>

        {/* Output price */}
        <div className="text-center">
          <span className={cn(
            "text-[12px] tabular-nums",
            outputPrice > 0 ? "font-semibold text-text-main" : "text-text-muted/60"
          )}>
            {formatPrice(outputPrice)}
          </span>
        </div>

        {/* Context */}
        <div className="text-center">
          <span className="text-[12px] text-text-muted tabular-nums">
            {typeof model.contextWindow === "number" && !isNaN(model.contextWindow)
              ? `${(model.contextWindow / 1000).toFixed(0)}K`
              : "—"}
          </span>
        </div>

        {/* Edit action */}
        <div className="flex justify-center">
          <button
            onClick={() => onEdit(model)}
            className="w-7 h-7 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all"
            title="Edit pricing"
          >
            <span className="material-symbols-outlined text-[14px] text-text-muted">edit</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden hover:shadow-md transition-all group border border-transparent hover:border-border">
      {/* Card header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] shrink-0">
              <span className="material-symbols-outlined text-[18px] text-text-muted">smart_toy</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-text-main truncate">{model.id}</h3>
              <span className="text-[11px] text-text-muted">{model.provider}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasCustomPrice && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                Custom
              </span>
            )}
            <Badge
              variant={inputPrice === 0 && outputPrice === 0 ? "success" : "default"}
              size="sm"
            >
              {inputPrice === 0 && outputPrice === 0 ? "Free" : "Paid"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 border-t border-black/[0.04] dark:border-white/[0.04]">
        <button
          onClick={() => onEdit(model)}
          className="px-4 py-2.5 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors border-r border-black/[0.04] dark:border-white/[0.04] group/price"
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-0.5 flex items-center gap-1">
            Input
            <span className="material-symbols-outlined text-[10px] opacity-0 group-hover/price:opacity-60 transition-opacity">edit</span>
          </p>
          <p className="text-[13px] font-semibold text-text-main tabular-nums">{formatPrice(inputPrice)}</p>
        </button>
        <button
          onClick={() => onEdit(model)}
          className="px-4 py-2.5 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors border-r border-black/[0.04] dark:border-white/[0.04] group/price"
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-0.5 flex items-center gap-1">
            Output
            <span className="material-symbols-outlined text-[10px] opacity-0 group-hover/price:opacity-60 transition-opacity">edit</span>
          </p>
          <p className="text-[13px] font-semibold text-text-main tabular-nums">{formatPrice(outputPrice)}</p>
        </button>
        <div className="px-4 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-0.5">Context</p>
          <p className="text-[13px] font-semibold text-text-main tabular-nums">
            {model.contextWindow ? `${(model.contextWindow / 1000).toFixed(0)}K` : "—"}
          </p>
        </div>
      </div>

      {/* Usage footer */}
      <div className="px-4 py-2.5 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Usage</span>
        <div className="flex items-center gap-2">
          {usageCount > 0 && (
            <div className="w-16 h-[3px] rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60"
                style={{ width: `${Math.min(Math.max((usageCount / 100) * 100, 8), 100)}%` }}
              />
            </div>
          )}
          <span className={cn(
            "text-[12px] font-semibold tabular-nums",
            usageCount > 0 ? "text-text-main" : "text-text-muted/50"
          )}>
            {usageCount > 0 ? formatUsageCount(usageCount) : "—"}
          </span>
        </div>
      </div>

      {/* Capabilities */}
      {capabilities.length > 0 && (
        <div className="px-4 py-2 border-t border-black/[0.04] dark:border-white/[0.04] flex flex-wrap gap-1.5">
          {capabilities.map((cap) => (
            <span key={cap} className="text-[10px] font-medium text-text-muted bg-black/[0.03] dark:bg-white/[0.05] px-1.5 py-0.5 rounded">
              {cap}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
