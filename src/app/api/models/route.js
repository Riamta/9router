import { NextResponse } from "next/server";
import { getProviderConnections, getProviderNodes, getModelAliases, setModelAlias } from "@/models";
import { AI_PROVIDERS, isOpenAICompatibleProvider, isAnthropicCompatibleProvider } from "@/shared/constants/providers";
import { PROVIDER_MODELS, PROVIDER_ID_TO_ALIAS } from "open-sse/config/providerModels.js";
import { getPricingForModel } from "@/shared/constants/pricing.js";

export const dynamic = "force-dynamic";

// Fetch models from a compatible provider's /models endpoint
async function fetchCompatibleModels(conn) {
  const baseUrl = conn.providerSpecificData?.baseUrl;
  if (!baseUrl) return [];

  try {
    let modelsUrl;
    const headers = { "Content-Type": "application/json" };

    if (isAnthropicCompatibleProvider(conn.provider)) {
      let cleanUrl = baseUrl.replace(/\/$/, "");
      if (cleanUrl.endsWith("/messages")) cleanUrl = cleanUrl.slice(0, -9);
      modelsUrl = `${cleanUrl}/models`;
      headers["anthropic-version"] = "2023-06-01";
      headers["x-api-key"] = conn.apiKey;
      headers["Authorization"] = `Bearer ${conn.apiKey}`;
    } else {
      modelsUrl = `${baseUrl.replace(/\/$/, "")}/models`;
      headers["Authorization"] = `Bearer ${conn.apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(modelsUrl, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();
    const rawModels = data.data || data.models || [];

    return rawModels.map(m => ({
      id: typeof m === "string" ? m : (m.id || m.name || m.model),
      name: typeof m === "string" ? m : (m.name || m.id || m.model),
    })).filter(m => m.id);
  } catch {
    return [];
  }
}

// Build a map from compatible provider ID -> display name
function buildDisplayNameMap(nodes, connections) {
  const map = {};
  for (const node of nodes) {
    if (node.name && (node.type === "openai-compatible" || node.type === "anthropic-compatible")) {
      map[node.id] = node.name;
    }
  }
  for (const conn of connections) {
    if (conn.provider && conn.displayName && (isOpenAICompatibleProvider(conn.provider) || isAnthropicCompatibleProvider(conn.provider))) {
      if (!map[conn.provider]) map[conn.provider] = conn.displayName;
    }
  }
  return map;
}

// GET /api/models - Get all models from active providers
export async function GET() {
  try {
    // Get active connections and nodes
    const connections = await getProviderConnections();
    const nodes = await getProviderNodes();
    const modelAliases = await getModelAliases();
    const displayNames = buildDisplayNameMap(nodes, connections);
    
    const allModels = [];
    const seenModels = new Set();
    
    // Helper to add model
    const addModel = (modelObj, source, type = "api", connectionId = null) => {
      const modelId = modelObj.id;
      const key = `${source}/${modelId}`;
      if (seenModels.has(key)) return;
      seenModels.add(key);
      
      const fullModel = `${source}/${modelId}`;
      const pricing = getPricingForModel(source, modelId) || getPricingForModel(source, fullModel);
      const inputPrice = pricing?.input ?? 0;
      const outputPrice = pricing?.output ?? 0;
      const providerName = displayNames[source] || AI_PROVIDERS[source]?.name || source;
      
      allModels.push({
        id: modelId,
        name: modelAliases[fullModel] || modelObj.name || modelId,
        provider: source,
        providerName,
        fullModel,
        alias: modelAliases[fullModel] || null,
        source: type,
        description: "",
        contextWindow: pricing ? "Available" : "Unknown",
        pricing: pricing ? { input: pricing.input, output: pricing.output } : { input: 0, output: 0 },
        capabilities: {
          streaming: true,
          functionCalling: pricing?.input != null,
          vision: false,
          json: true,
          tools: pricing?.input != null,
        },
        isFree: inputPrice === 0 && outputPrice === 0,
        connectionId: connectionId,
      });
    };
    
    // 1. From API Key connections
    for (const conn of connections) {
      const provider = conn.provider;
      const isCompatible = isOpenAICompatibleProvider(provider) || isAnthropicCompatibleProvider(provider);

      if (isCompatible) {
        // For compatible providers: use enabledModels if set, otherwise fetch from endpoint
        const enabledModels = conn.providerSpecificData?.enabledModels;
        if (Array.isArray(enabledModels) && enabledModels.length > 0) {
          enabledModels.forEach(m => addModel({ id: m, name: m }, provider, "api", conn.id));
        } else {
          // No enabledModels yet — fetch from provider endpoint as fallback
          const compatibleModels = await fetchCompatibleModels(conn);
          compatibleModels.forEach(m => addModel(m, provider, "api", conn.id));
        }
      } else {
        const alias = PROVIDER_ID_TO_ALIAS[provider] || provider;
        const models = PROVIDER_MODELS[alias] || [];
        models.forEach(m => addModel(m, provider, "api", conn.id));
      }
    }
    
    // 2. From OAuth/CLI nodes - use PROVIDER_MODELS
    for (const node of nodes) {
      const provider = node.provider || node.type;
      const alias = PROVIDER_ID_TO_ALIAS[provider] || provider;
      const models = PROVIDER_MODELS[alias] || [];
      
      const type = node.type?.includes('cli') ? 'cli' : 
                   node.type?.includes('oauth') ? 'oauth' : 'node';
      
      models.forEach(m => addModel(m, provider, type, node.id));
    }
    
    // Sort: free first, then by provider
    allModels.sort((a, b) => {
      if (a.isFree && !b.isFree) return -1;
      if (!a.isFree && b.isFree) return 1;
      if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
      return a.id.localeCompare(b.id);
    });
    
    return NextResponse.json({
      models: allModels,
      count: allModels.length,
      providers: [...new Set(allModels.map(m => m.provider))].sort(),
    });
  } catch (error) {
    console.error("[Models API] Error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch models", 
      models: [], 
      count: 0, 
      providers: [] 
    }, { status: 500 });
  }
}

// PUT /api/models - Update model alias
export async function PUT(request) {
  try {
    const body = await request.json();
    const { model, alias } = body;

    if (!model || !alias) {
      return NextResponse.json({ error: "Model and alias required" }, { status: 400 });
    }

    const modelAliases = await getModelAliases();

    const existing = Object.entries(modelAliases).find(
      ([key, val]) => val === alias && key !== model
    );

    if (existing) {
      return NextResponse.json({ error: "Alias already in use" }, { status: 400 });
    }

    await setModelAlias(model, alias);

    return NextResponse.json({ success: true, model, alias });
  } catch (error) {
    console.error("Error updating alias:", error);
    return NextResponse.json({ error: "Failed to update alias" }, { status: 500 });
  }
}
