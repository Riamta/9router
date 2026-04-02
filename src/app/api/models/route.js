import { NextResponse } from "next/server";
import { getProviderConnections, getProviderNodes, getModelAliases, setModelAlias } from "@/models";
import { AI_PROVIDERS } from "@/shared/constants/providers";
import { PROVIDER_MODELS, PROVIDER_ID_TO_ALIAS } from "open-sse/config/providerModels.js";

export const dynamic = "force-dynamic";

// GET /api/models - Get all models from active providers
export async function GET() {
  try {
    // Get active connections and nodes
    const connections = await getProviderConnections();
    const nodes = await getProviderNodes();
    const modelAliases = await getModelAliases();
    
    const allModels = [];
    const seenModels = new Set();
    
    // Helper to add model
    const addModel = (modelObj, source, type = "api", connectionId = null) => {
      const modelId = modelObj.id;
      const key = `${source}/${modelId}`;
      if (seenModels.has(key)) return;
      seenModels.add(key);
      
      const providerConfig = AI_PROVIDERS[source] || {};
      const inputPrice = providerConfig.inputPrice || 0;
      const outputPrice = providerConfig.outputPrice || 0;
      const fullModel = `${source}/${modelId}`;
      
      allModels.push({
        id: modelId,
        name: modelAliases[fullModel] || modelObj.name || modelId,
        provider: source,
        fullModel,
        alias: modelAliases[fullModel] || null,
        source: type,
        description: "",
        contextWindow: providerConfig.contextWindow || "Unknown",
        pricing: { input: inputPrice, output: outputPrice },
        capabilities: {
          streaming: true,
          functionCalling: providerConfig.supportsFunctions || false,
          vision: providerConfig.supportsVision || false,
          json: true,
          tools: providerConfig.supportsTools || false,
        },
        isFree: inputPrice === 0 && outputPrice === 0,
        connectionId: connectionId,
      });
    };
    
    // 1. From API Key connections - use PROVIDER_MODELS
    for (const conn of connections) {
      const provider = conn.provider;
      const alias = PROVIDER_ID_TO_ALIAS[provider] || provider;
      const models = PROVIDER_MODELS[alias] || [];
      
      models.forEach(m => addModel(m, provider, "api", conn.id));
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
