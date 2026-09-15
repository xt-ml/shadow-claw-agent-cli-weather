#!/usr/bin/env node
// bin/resolve-location.mjs — Resolve location to coordinates and timezone via Open-Meteo

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const CACHE_DIR = path.join(ROOT_DIR, ".cache");
const DEFAULT_LOC_FILE = path.join(CACHE_DIR, "default-location.json");

const HARDCODED_FALLBACK = {
  name: "Chicago, Illinois, United States",
  latitude: 41.8781,
  longitude: -87.6298,
  timezone: "America/Chicago",
};

function getSavedDefault() {
  try {
    if (fs.existsSync(DEFAULT_LOC_FILE)) {
      const raw = fs.readFileSync(DEFAULT_LOC_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed.name && parsed.latitude && parsed.longitude) {
        return parsed;
      }
    }
  } catch {
    // Ignore read/parse errors and use fallback
  }
  return HARDCODED_FALLBACK;
}

function saveDefault(location) {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  fs.writeFileSync(
    DEFAULT_LOC_FILE,
    JSON.stringify(location, null, 2) + "\n",
    "utf8",
  );
}

async function geocodeQuery(query) {
  const fetchGeocode = async (q) => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`;
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
        const data = await res.json();
        return data.results && data.results.length > 0 ? data.results[0] : null;
      } catch (err) {
        lastErr = err;
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
        }
      }
    }
    throw lastErr;
  };

  let result = await fetchGeocode(query);

  // If full string not found, try the first component (e.g. city) before comma
  if (!result && query.includes(",")) {
    const fallbackQuery = query.split(",")[0].trim();
    if (fallbackQuery) {
      result = await fetchGeocode(fallbackQuery);
    }
  }

  if (!result) {
    throw new Error(`Location not found: "${query}"`);
  }

  const parts = [result.name, result.admin1, result.country].filter(Boolean);
  const displayName = parts.length > 0 ? parts.join(", ") : result.name;

  return {
    name: displayName,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone || "auto",
  };
}

function escapeShell(val) {
  return `"${String(val).replace(/["\\$`]/g, "\\$&")}"`;
}

async function main() {
  const args = process.argv.slice(2);
  let mode = "shell"; // "shell" | "json" | "set-default"
  let query = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--json") {
      mode = "json";
    } else if (arg === "--shell") {
      mode = "shell";
    } else if (arg === "--set-default") {
      mode = "set-default";
      if (args[i + 1] && !args[i + 1].startsWith("-")) {
        query = args[++i];
      }
    } else if (arg === "-l" || arg === "--location") {
      if (args[i + 1]) {
        query = args[++i];
      }
    } else if (!arg.startsWith("-") && !query) {
      query = arg;
    }
  }

  if (!query) {
    query = process.env.WEATHER_LOCATION || process.env.DEFAULT_LOCATION || "";
  }

  let location;
  if (query) {
    try {
      location = await geocodeQuery(query);
    } catch (err) {
      console.error(`Error resolving location "${query}": ${err.message}`);
      process.exit(1);
    }
  } else {
    location = getSavedDefault();
  }

  if (mode === "set-default") {
    saveDefault(location);
    console.error(`Updated default location in ${DEFAULT_LOC_FILE}:`);
    console.log(JSON.stringify(location, null, 2));
    return;
  }

  if (mode === "json") {
    console.log(JSON.stringify(location, null, 2));
    return;
  }

  // Shell variable assignments for eval
  const tzEncoded = encodeURIComponent(location.timezone || "auto");
  console.log(`LOC_NAME=${escapeShell(location.name)}`);
  console.log(`LOC_LAT=${escapeShell(location.latitude)}`);
  console.log(`LOC_LON=${escapeShell(location.longitude)}`);
  console.log(`LOC_TZ=${escapeShell(location.timezone || "auto")}`);
  console.log(`LOC_TZ_ENCODED=${escapeShell(tzEncoded)}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
