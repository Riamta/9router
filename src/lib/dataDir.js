import path from "path";
import os from "os";
import fs from "fs";

// Primary app name for this fork
const APP_NAME = "api2k";
// Fallback: check legacy "9router" dir if api2k doesn't exist yet (migration support)
const LEGACY_APP_NAME = "9router";

export function getDataDir() {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;

  const homeDir = os.homedir();

  if (process.platform === "win32") {
    const appData = process.env.APPDATA || path.join(homeDir, "AppData", "Roaming");
    const primary = path.join(appData, APP_NAME);
    const legacy = path.join(appData, LEGACY_APP_NAME);
    if (!fs.existsSync(primary) && fs.existsSync(legacy)) return legacy;
    return primary;
  }

  const primary = path.join(homeDir, `.${APP_NAME}`);
  const legacy = path.join(homeDir, `.${LEGACY_APP_NAME}`);
  if (!fs.existsSync(primary) && fs.existsSync(legacy)) return legacy;
  return primary;
}

export const DATA_DIR = getDataDir();
