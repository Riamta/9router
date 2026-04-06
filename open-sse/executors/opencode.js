import { BaseExecutor } from "./base.js";
import { PROVIDERS } from "../config/providers.js";

/**
 * OpencodeExecutor - Executor for OpenCode providers (opencode-zen, opencode-go)
 * Supports multiple API formats: OpenAI, Claude, Gemini, OpenAI-Responses
 */
export class OpencodeExecutor extends BaseExecutor {
  constructor(provider) {
    super(provider, PROVIDERS[provider] || PROVIDERS["opencode-zen"]);
  }

  /**
   * Get target format for a specific model
   * Models can specify targetFormat in their config to use different APIs
   */
  _getModelFormat(model) {
    const providerConfig = PROVIDERS[this.provider];
    if (!providerConfig?.models) return "openai";
    
    const modelConfig = providerConfig.models.find(m => m.id === model);
    return modelConfig?.targetFormat || "openai";
  }

  /**
   * Build URL based on model's target format
   */
  buildUrl(model, stream, urlIndex = 0, credentials = null) {
    const format = this._getModelFormat(model);
    const baseUrl = this.config.baseUrl.replace(/\/chat\/completions$/, "");
    
    switch (format) {
      case "claude":
        return `${baseUrl}/messages`;
      
      case "openai-responses":
        return `${baseUrl}/responses`;
      
      case "gemini":
        return `${baseUrl}/models/${model}:${stream ? "streamGenerateContent?alt=sse" : "generateContent"}`;
      
      case "openai":
      default:
        return `${baseUrl}/chat/completions`;
    }
  }

  /**
   * Build headers based on target format
   */
  buildHeaders(credentials, stream = true) {
    const headers = {
      "Content-Type": "application/json",
      ...this.config.headers
    };

    // Get current model from credentials if available
    const model = credentials?.model;
    const format = model ? this._getModelFormat(model) : "openai";

    // Add auth header
    const key = credentials?.apiKey || credentials?.accessToken;
    if (key) {
      if (format === "claude") {
        headers["x-api-key"] = key;
        headers["anthropic-version"] = "2023-06-01";
      } else {
        headers["Authorization"] = `Bearer ${key}`;
      }
    }

    // Add format-specific headers
    if (format === "claude") {
      headers["anthropic-version"] = headers["anthropic-version"] || "2023-06-01";
    }

    if (stream) {
      headers["Accept"] = "text/event-stream";
    }

    return headers;
  }

  /**
   * Transform request body based on target format
   */
  transformRequest(model, body, stream, credentials) {
    const format = this._getModelFormat(model);
    
    // Clone body to avoid mutations
    const transformedBody = { ...body };
    
    switch (format) {
      case "claude":
        // Transform OpenAI format to Claude format
        return this._transformToClaude(transformedBody, stream);
      
      case "gemini":
        // Transform OpenAI format to Gemini format
        return this._transformToGemini(transformedBody, stream);
      
      case "openai-responses":
        // Keep as-is but ensure proper structure
        return transformedBody;
      
      case "openai":
      default:
        return transformedBody;
    }
  }

  /**
   * Transform OpenAI format to Claude format
   */
  _transformToClaude(body, stream) {
    const transformed = {
      model: body.model,
      max_tokens: body.max_tokens || 4096,
      stream: stream !== false,
    };

    // Transform messages
    if (body.messages) {
      transformed.messages = body.messages.map(msg => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: typeof msg.content === "string" 
          ? msg.content 
          : this._extractTextFromContent(msg.content)
      }));
    }

    // Handle system messages
    const systemMsg = body.messages?.find(m => m.role === "system");
    if (systemMsg) {
      transformed.system = typeof systemMsg.content === "string"
        ? systemMsg.content
        : this._extractTextFromContent(systemMsg.content);
    }

    // Handle temperature
    if (body.temperature !== undefined) {
      transformed.temperature = body.temperature;
    }

    // Handle tools
    if (body.tools) {
      transformed.tools = body.tools;
    }

    return transformed;
  }

  /**
   * Transform OpenAI format to Gemini format
   */
  _transformToGemini(body, stream) {
    const contents = [];
    
    if (body.messages) {
      for (const msg of body.messages) {
        const role = msg.role === "user" ? "user" : "model";
        const parts = [];
        
        if (typeof msg.content === "string") {
          parts.push({ text: msg.content });
        } else if (Array.isArray(msg.content)) {
          for (const part of msg.content) {
            if (part.type === "text") {
              parts.push({ text: part.text });
            } else if (part.type === "image_url") {
              parts.push({
                inlineData: {
                  mimeType: "image/jpeg",
                  data: part.image_url?.url?.split(",")[1] || part.image_url?.url
                }
              });
            }
          }
        }
        
        contents.push({ role, parts });
      }
    }

    const transformed = { contents };

    // Handle generation config
    const generationConfig = {};
    if (body.max_tokens) generationConfig.maxOutputTokens = body.max_tokens;
    if (body.temperature !== undefined) generationConfig.temperature = body.temperature;
    
    if (Object.keys(generationConfig).length > 0) {
      transformed.generationConfig = generationConfig;
    }

    return transformed;
  }

  /**
   * Extract text from complex content
   */
  _extractTextFromContent(content) {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .filter(c => c.type === "text")
        .map(c => c.text)
        .join("\n");
    }
    return JSON.stringify(content);
  }

  /**
   * Parse error response
   */
  parseError(response, bodyText) {
    try {
      const error = JSON.parse(bodyText);
      return {
        status: response.status,
        message: error.error?.message || error.message || bodyText || `HTTP ${response.status}`
      };
    } catch {
      return {
        status: response.status,
        message: bodyText || `HTTP ${response.status}`
      };
    }
  }
}

export default OpencodeExecutor;
