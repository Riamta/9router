"use server";

import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

const getConfigDir = () => path.join(os.homedir(), ".config", "opencode");
const getConfigPath = () => path.join(getConfigDir(), "opencode.json");

const checkOpenCodeInstalled = async () => {
  try {
    const isWindows = os.platform() === "win32";
    const command = isWindows ? "where opencode" : "command -v opencode";
    await execAsync(command, { windowsHide: true });
    return true;
  } catch {
    return false;
  }
};

const readConfig = async () => {
  try {
    const content = await fs.readFile(getConfigPath(), "utf-8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};

const hasApi2KConfig = (config) => {
  if (!config?.provider) return false;
  return !!config.provider["api2k"];
};

// GET - Check opencode CLI and read current settings
export async function GET() {
  try {
    const isInstalled = await checkOpenCodeInstalled();

    if (!isInstalled) {
      return NextResponse.json({
        installed: false,
        config: null,
        message: "OpenCode CLI is not installed",
      });
    }

    const config = await readConfig();

    return NextResponse.json({
      installed: true,
      config,
      hasApi2K: hasApi2KConfig(config),
      configPath: getConfigPath(),
    });
  } catch (error) {
    console.log("Error checking opencode settings:", error);
    return NextResponse.json({ error: "Failed to check opencode settings" }, { status: 500 });
  }
}

// POST - Apply Api2K as openai-compatible provider
export async function POST(request) {
  try {
    const { baseUrl, apiKey, model } = await request.json();

    if (!baseUrl || !model) {
      return NextResponse.json({ error: "baseUrl and model are required" }, { status: 400 });
    }

    const configDir = getConfigDir();
    const configPath = getConfigPath();

    await fs.mkdir(configDir, { recursive: true });

    // Read existing config or start fresh
    let config = {};
    try {
      const existing = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(existing);
    } catch { /* No existing config */ }

    const normalizedBaseUrl = baseUrl.endsWith("/v1") ? baseUrl : `${baseUrl}/v1`;
    const keyToUse = apiKey || "sk_api2k";

    // Merge api2k provider
    if (!config.provider) config.provider = {};
    config.provider["api2k"] = {
      npm: "@ai-sdk/openai-compatible",
      options: {
        baseURL: normalizedBaseUrl,
        apiKey: keyToUse,
      },
      models: {
        [model]: { name: model },
      },
    };

    // Set as active model
    config.model = `api2k/${model}`;

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      message: "OpenCode settings applied successfully!",
      configPath,
    });
  } catch (error) {
    console.log("Error updating opencode settings:", error);
    return NextResponse.json({ error: "Failed to update opencode settings" }, { status: 500 });
  }
}

// DELETE - Remove Api2K provider from config
export async function DELETE() {
  try {
    const configPath = getConfigPath();

    let config = {};
    try {
      const existing = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(existing);
    } catch (error) {
      if (error.code === "ENOENT") {
        return NextResponse.json({ success: true, message: "No config file to reset" });
      }
      throw error;
    }

    // Remove api2k provider
    if (config.provider) delete config.provider["api2k"];

    // Reset model if it was pointing to api2k
    if (config.model?.startsWith("api2k/")) delete config.model;

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      message: "Api2K settings removed from OpenCode",
    });
  } catch (error) {
    console.log("Error resetting opencode settings:", error);
    return NextResponse.json({ error: "Failed to reset opencode settings" }, { status: 500 });
  }
}
