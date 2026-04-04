"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Card from "@/shared/components/Card";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";
import Badge from "@/shared/components/Badge";
import { Search, Filter, Grid3X3, List, Cpu, DollarSign, Zap, Edit2, X } from "lucide-react";

export default function ModelsPage() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [providers, setProviders] = useState([]);
  
  // Custom prices state (provider -> model -> price)
  const [customPrices, setCustomPrices] = useState({});
  
  // Edit modal state
  const [editingModel, setEditingModel] = useState(null);
  const [editInputPrice, setEditInputPrice] = useState("");
  const [editOutputPrice, setEditOutputPrice] = useState("");

  // Load custom prices from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("9router-custom-prices");
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
    localStorage.setItem("9router-custom-prices", JSON.stringify(prices));
  };

  useEffect(() => {
    fetchModels();
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

  // Get effective price (custom or default)
  const getPrice = (model, type) => {
    const key = `${model.provider}/${model.id}`;
    const custom = customPrices[key];
    if (custom && custom[type] !== undefined) {
      return custom[type];
    }
    return model.pricing?.[type] || 0;
  };

  const filteredModels = models.filter((model) => {
    const matchesSearch = 
      model.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProvider = selectedProvider === "all" || model.provider === selectedProvider;
    
    return matchesSearch && matchesProvider;
  });

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">
          Model Library
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse and explore all available AI models. Click price to customize.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-foreground text-background">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{models.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Total Models
              </p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-foreground text-background">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{providers.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Providers
              </p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-foreground text-background">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">
                {models.filter(m => getPrice(m, "input") === 0 && getPrice(m, "output") === 0).length}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Free Models
              </p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-foreground text-background">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{filteredModels.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Filtered
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <Input
              icon="search"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            {/* Provider Filter */}
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="h-10 px-4 rounded-lg border-2 border-input bg-transparent text-sm font-medium focus:outline-none focus:border-foreground"
            >
              <option value="all">All Providers</option>
              {providers.map((provider) => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg border-2 border-border">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Models Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
            <span className="text-lg font-semibold">Loading models...</span>
          </div>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-accent mb-4">
            <Search className="h-8 w-8 text-foreground/40" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No Models Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      ) : (
        <>
          {/* List View Container */}
          {viewMode === "list" ? (
            <Card padding="none" className="overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[3fr_1.5fr_1.5fr_1.5fr_1.5fr_auto] gap-4 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border bg-accent/30">
                <div>Name</div>
                <div className="text-center">Input</div>
                <div className="text-center">Output</div>
                <div className="text-center">Context</div>
                <div className="text-center">Provider</div>
                <div className="w-16 text-center">Action</div>
              </div>
              {/* Table Rows */}
              <div className="flex flex-col">
                {filteredModels.map((model) => (
                  <ModelCard 
                    key={model.id} 
                    model={model} 
                    viewMode={viewMode}
                    formatPrice={formatPrice}
                    getPrice={getPrice}
                    onEdit={openEditModal}
                    hasCustomPrice={!!customPrices[`${model.provider}/${model.id}`]}
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
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Edit Price Modal */}
      {editingModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 relative">
            <button
              onClick={closeEditModal}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            
            <h3 className="text-lg font-black text-foreground mb-1 uppercase">
              Custom Pricing
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {editingModel.provider}/{editingModel.id}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
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
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
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

function ModelCard({ model, viewMode, formatPrice, getPrice, onEdit, hasCustomPrice }) {
  const capabilities = [
    model.capabilities?.streaming && "Streaming",
    model.capabilities?.functionCalling && "Functions",
    model.capabilities?.vision && "Vision",
    model.capabilities?.json && "JSON",
    model.capabilities?.tools && "Tools",
  ].filter(Boolean);

  const inputPrice = getPrice(model, "input");
  const outputPrice = getPrice(model, "output");

  if (viewMode === "list") {
    return (
      <div className="grid grid-cols-[3fr_1.5fr_1.5fr_1.5fr_1.5fr_auto] gap-4 px-4 py-3 items-center border-b border-border hover:bg-accent/50 transition-colors group">
        {/* Name */}
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-bold text-foreground truncate">{model.id}</h3>
          {hasCustomPrice && (
            <Badge variant="outline" size="sm" className="border-primary text-primary text-[10px] shrink-0">
              Custom
            </Badge>
          )}
        </div>

        {/* Input */}
        <div className="text-center">
          <span className="text-sm font-bold text-foreground tabular-nums">{formatPrice(inputPrice)}</span>
        </div>

        {/* Output */}
        <div className="text-center">
          <span className="text-sm font-bold text-foreground tabular-nums">{formatPrice(outputPrice)}</span>
        </div>

        {/* Context */}
        <div className="text-center text-sm text-foreground">
          {typeof model.contextWindow === "number" && !isNaN(model.contextWindow)
            ? `${(model.contextWindow / 1000).toFixed(0)}K`
            : "Unknown"}
        </div>

        {/* Provider */}
        <div className="text-center">
          <Badge
            variant={inputPrice === 0 && outputPrice === 0 ? "success" : "default"}
            size="sm"
          >
            {model.provider}
          </Badge>
        </div>

        {/* Action */}
        <div className="w-16 flex justify-center">
          <button
            onClick={() => onEdit(model)}
            className="p-1.5 rounded-lg hover:bg-accent border border-transparent hover:border-border transition-colors opacity-0 group-hover:opacity-100"
            title="Edit pricing"
          >
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Card padding="md" className="hover:border-foreground/50 transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground truncate mb-1 group-hover:text-foreground/80">
            {model.id}
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{model.provider}</p>
            {hasCustomPrice && (
              <Badge variant="outline" size="sm" className="border-primary text-primary text-[10px]">
                Custom
              </Badge>
            )}
          </div>
        </div>
        <Badge 
          variant={inputPrice === 0 && outputPrice === 0 ? "success" : "default"}
          size="sm"
        >
          {inputPrice === 0 && outputPrice === 0 ? "Free" : "Paid"}
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Editable Pricing */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onEdit(model)}
            className="p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors text-left group/price"
          >
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Input
              </p>
              <Edit2 className="h-3 w-3 opacity-0 group-hover/price:opacity-100 transition-opacity text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">
              {formatPrice(inputPrice)}
            </p>
          </button>
          <button
            onClick={() => onEdit(model)}
            className="p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors text-left group/price"
          >
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Output
              </p>
              <Edit2 className="h-3 w-3 opacity-0 group-hover/price:opacity-100 transition-opacity text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">
              {formatPrice(outputPrice)}
            </p>
          </button>
        </div>

        {/* Context Window */}
        <div className="flex items-center justify-between py-2 border-t border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Context Window
          </span>
          <span className="text-sm font-bold text-foreground">
            {model.contextWindow ? `${(model.contextWindow / 1000).toFixed(0)}K tokens` : "Unknown"}
          </span>
        </div>

        {/* Capabilities */}
        {capabilities.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {capabilities.map((cap) => (
              <Badge key={cap} variant="secondary" size="sm">
                {cap}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
