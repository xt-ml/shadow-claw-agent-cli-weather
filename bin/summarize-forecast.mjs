#!/usr/bin/env node
// bin/summarize-forecast.mjs — Fetch and summarize Open-Meteo forecast data for agent consumption

import path from "node:path";
import { fileURLToPath } from "node:url";

const WMO_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function wmoDesc(code) {
  return WMO_CODES[code] || `Weather condition (code ${code})`;
}

async function fetchWithRetry(url, maxAttempts = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
      }
    }
  }
  throw lastErr;
}

async function main() {
  const args = process.argv.slice(2);
  let lat = 41.8781;
  let lon = -87.6298;
  let tz = "America/Chicago";
  let days = 7;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--lat" && args[i + 1]) lat = parseFloat(args[++i]);
    else if (args[i] === "--lon" && args[i + 1]) lon = parseFloat(args[++i]);
    else if (args[i] === "--tz" && args[i + 1]) tz = args[++i];
    else if (args[i] === "--days" && args[i + 1])
      days = parseInt(args[++i], 10);
  }

  const encodedTz = encodeURIComponent(tz);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,snowfall_sum,wind_speed_10m_max,wind_gusts_10m_max&hourly=temperature_2m,precipitation_probability,precipitation,snowfall,weather_code,wind_gusts_10m,visibility&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=${encodedTz}&forecast_days=${days}`;

  const data = await fetchWithRetry(url);
  const daily = data.daily || {};
  const times = daily.time || [];

  const lines = [];
  lines.push("### Daily Forecast Overview");
  for (let i = 0; i < times.length; i++) {
    const date = times[i];
    const high = daily.temperature_2m_max?.[i] ?? "N/A";
    const low = daily.temperature_2m_min?.[i] ?? "N/A";
    const rain = daily.precipitation_sum?.[i] ?? 0;
    const snow = daily.snowfall_sum?.[i] ?? 0;
    const gust = daily.wind_gusts_10m_max?.[i] ?? 0;
    const code = daily.weather_code?.[i] ?? 0;
    const desc = wmoDesc(code);

    let precipStr = `${rain} mm rain`;
    if (snow > 0) precipStr += `, ${snow} cm snow`;
    lines.push(
      `- **${date}**: ${desc} | High: ${high}°C, Low: ${low}°C | Precip: ${precipStr} | Max Wind Gust: ${gust} km/h`,
    );
  }

  const hourly = data.hourly || {};
  const hTimes = hourly.time || [];

  // Detailed 3-day diurnal breakdown (Morning 06-12, Afternoon 12-18, Evening 18-24)
  lines.push("");
  lines.push("### Next 3 Days Detailed Driving Windows");
  const threeDays = times.slice(0, 3);
  for (const date of threeDays) {
    const dayEntries = { morning: [], afternoon: [], evening: [] };
    for (let i = 0; i < hTimes.length; i++) {
      if (!hTimes[i].startsWith(date)) continue;
      const hour = parseInt(hTimes[i].split("T")[1].split(":")[0], 10);
      const entry = {
        temp: hourly.temperature_2m?.[i],
        precip: hourly.precipitation?.[i] || 0,
        gust: hourly.wind_gusts_10m?.[i] || 0,
        code: hourly.weather_code?.[i] || 0,
      };
      if (hour >= 6 && hour < 12) dayEntries.morning.push(entry);
      else if (hour >= 12 && hour < 18) dayEntries.afternoon.push(entry);
      else if (hour >= 18 && hour < 24) dayEntries.evening.push(entry);
    }

    const summarizePart = (entries) => {
      if (entries.length === 0) return "No data";
      const maxP = Math.max(...entries.map((e) => e.precip));
      const maxG = Math.max(...entries.map((e) => e.gust));
      const avgT = Math.round(
        entries.reduce((s, e) => s + (e.temp || 0), 0) / entries.length,
      );
      const rainy = maxP > 0 ? `, Rain: up to ${maxP} mm` : ", Dry";
      return `~${avgT}°C${rainy}, Gusts to ${maxG} km/h`;
    };

    lines.push(
      `- **${date}**: Morning (06-12): ${summarizePart(dayEntries.morning)} | Afternoon (12-18): ${summarizePart(dayEntries.afternoon)} | Evening (18-24): ${summarizePart(dayEntries.evening)}`,
    );
  }

  // Scan hourly data for notable alerts
  const alerts = [];

  for (let i = 0; i < hTimes.length; i++) {
    const temp = hourly.temperature_2m?.[i];
    const precip = hourly.precipitation?.[i] || 0;
    const snow = hourly.snowfall?.[i] || 0;
    const gust = hourly.wind_gusts_10m?.[i] || 0;
    const vis = hourly.visibility?.[i];
    const timeStr = hTimes[i];

    if (temp !== undefined && temp <= 0.5 && (precip > 0 || snow > 0)) {
      alerts.push(
        `- Sub-zero precipitation risk at ${timeStr} (temp ${temp}°C, precip ${precip}mm)`,
      );
    }
    if (gust > 50) {
      alerts.push(`- High wind gusts at ${timeStr} (${gust} km/h)`);
    }
    if (vis !== undefined && vis < 1000) {
      alerts.push(
        `- Dense fog / low visibility at ${timeStr} (${Math.round(vis)} m)`,
      );
    }
  }

  if (alerts.length > 0) {
    lines.push("");
    lines.push("### Observed Weather Hazard Flags in Data");
    // Show top 6 alerts to keep token budget concise
    lines.push(...alerts.slice(0, 6));
    if (alerts.length > 6) {
      lines.push(
        `- (...and ${alerts.length - 6} other similar hourly threshold events)`,
      );
    }
  } else {
    lines.push("");
    lines.push("### Observed Weather Hazard Flags in Data");
    lines.push(
      "- No severe weather thresholds exceeded (no sub-zero precipitation, wind gusts <= 50 km/h, visibility normal).",
    );
  }

  process.stdout.write(lines.join("\n") + "\n");
}

main().catch((err) => {
  console.error(`Error fetching forecast: ${err.message}`);
  process.exit(1);
});
