#!/usr/bin/env node
// bin/scan-window.mjs — Accurately scan hourly Open-Meteo data for operational weather windows

import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCondition(c) {
  let minTemp = null;
  let maxTemp = null;
  let minSpread = null;
  let minHours = 1;
  let maxWind = null;
  let maxPrecip = null;

  const minTempMatch = c.match(
    /(?:temp(?:erature)?\s*(?:above|>)\s*|above\s*)(-?\d+(?:\.\d+)?)\s*(?:c|°c|degrees)?/i,
  );
  if (minTempMatch) minTemp = parseFloat(minTempMatch[1]);

  const maxTempMatch = c.match(
    /(?:temp(?:erature)?\s*(?:below|<)\s*|below\s*)(-?\d+(?:\.\d+)?)\s*(?:c|°c|degrees)?/i,
  );
  if (maxTempMatch) maxTemp = parseFloat(maxTempMatch[1]);

  const spreadMatch =
    c.match(
      /(\d+(?:\.\d+)?)\s*(?:c|deg|°c|degrees)?\s*above\s*(?:the\s*)?dew\s*point/i,
    ) ||
    c.match(
      /dew\s*point\s*(?:spread|difference)\s*(?:of\s*at\s*least|>|above)?\s*(\d+(?:\.\d+)?)/i,
    );
  if (spreadMatch) minSpread = parseFloat(spreadMatch[1]);

  const hoursMatch = c.match(/(\d+)\s*(?:hour|hr)/i);
  if (hoursMatch) minHours = parseInt(hoursMatch[1], 10);

  const windMatch = c.match(
    /wind\s*(?:under|<|below|less\s*than)\s*(\d+(?:\.\d+)?)/i,
  );
  if (windMatch) maxWind = parseFloat(windMatch[1]);

  if (/no\s*precip(?:itation)?|dry|no\s*rain/i.test(c)) {
    maxPrecip = 0.0;
  }

  return { minTemp, maxTemp, minSpread, minHours, maxWind, maxPrecip };
}

async function main() {
  const args = process.argv.slice(2);
  let lat = 41.8781;
  let lon = -87.6298;
  let tz = "America/Chicago";
  let locationName = "Chicago, Illinois, United States";
  let conditionStr = "";

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--lat") lat = parseFloat(args[++i]);
    else if (a === "--lon") lon = parseFloat(args[++i]);
    else if (a === "--tz") tz = args[++i];
    else if (a === "--location") locationName = args[++i];
    else if (!conditionStr) conditionStr = a;
  }

  const criteria = parseCondition(conditionStr);
  const tzEncoded = encodeURIComponent(tz);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,dew_point_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=${tzEncoded}&forecast_days=7`;

  let lastErr;
  let data;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
      break;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }

  if (!data || !data.hourly) {
    throw new Error(`Failed to fetch hourly forecast: ${lastErr?.message}`);
  }

  const h = data.hourly;
  const len = h.time.length;

  let currentRun = [];
  const qualifyingWindows = [];

  for (let i = 0; i < len; i++) {
    const time = h.time[i];
    const temp = h.temperature_2m[i];
    const dew = h.dew_point_2m[i];
    const spread = Math.round((temp - dew) * 10) / 10;
    const wind = h.wind_speed_10m[i];
    const precip = h.precipitation[i];

    let match = true;
    if (criteria.minTemp !== null && temp <= criteria.minTemp) match = false;
    if (criteria.maxTemp !== null && temp >= criteria.maxTemp) match = false;
    if (criteria.minSpread !== null && spread < criteria.minSpread)
      match = false;
    if (criteria.maxWind !== null && wind > criteria.maxWind) match = false;
    if (criteria.maxPrecip !== null && precip > criteria.maxPrecip)
      match = false;

    const hourData = { time, temp, dew, spread, wind, precip };

    if (match) {
      currentRun.push(hourData);
    } else {
      if (currentRun.length >= criteria.minHours) {
        qualifyingWindows.push([...currentRun]);
      }
      currentRun = [];
    }
  }
  if (currentRun.length >= criteria.minHours) {
    qualifyingWindows.push(currentRun);
  }

  // Output markdown context
  console.log(`### Calculated Operational Window Analysis`);
  console.log(`- **Location**: ${locationName}`);
  console.log(`- **Condition Evaluated**: "${conditionStr}"`);
  console.log(`- **Parsed Criteria**:`);
  if (criteria.minTemp !== null)
    console.log(`  - Minimum Temperature: > ${criteria.minTemp}°C`);
  if (criteria.maxTemp !== null)
    console.log(`  - Maximum Temperature: < ${criteria.maxTemp}°C`);
  if (criteria.minSpread !== null)
    console.log(
      `  - Minimum Dew Point Spread: ≥ ${criteria.minSpread}°C (Temperature - Dew Point)`,
    );
  if (criteria.minHours > 1)
    console.log(
      `  - Minimum Continuous Duration: ≥ ${criteria.minHours} consecutive hours`,
    );
  if (criteria.maxWind !== null)
    console.log(`  - Maximum Wind Speed: ≤ ${criteria.maxWind} km/h`);
  if (criteria.maxPrecip !== null)
    console.log(`  - Maximum Precipitation: ≤ ${criteria.maxPrecip} mm`);
  console.log(``);

  if (qualifyingWindows.length === 0) {
    console.log(
      `**Result**: No continuous ${criteria.minHours}-hour window meeting these conditions was found in the 7-day forecast.`,
    );
    return;
  }

  console.log(
    `**Result**: Found **${qualifyingWindows.length} qualifying window(s)** meeting all criteria in the next 7 days:\n`,
  );

  qualifyingWindows.forEach((win, idx) => {
    const start = win[0];
    const end = win[win.length - 1];
    const minT = Math.min(...win.map((w) => w.temp));
    const maxT = Math.max(...win.map((w) => w.temp));
    const minS = Math.min(...win.map((w) => w.spread));
    const maxW = Math.max(...win.map((w) => w.wind));

    console.log(
      `#### Window ${idx + 1}: ${start.time} to ${end.time} (${win.length} hours continuous)`,
    );
    console.log(
      `- **Start**: ${start.time} (Temp: ${start.temp}°C, Dew: ${start.dew}°C, Spread: ${start.spread}°C)`,
    );
    console.log(
      `- **End**: ${end.time} (Temp: ${end.temp}°C, Dew: ${end.dew}°C, Spread: ${end.spread}°C)`,
    );
    console.log(`- **Temperature Range**: ${minT}°C to ${maxT}°C`);
    console.log(
      `- **Dew Point Spread Range**: ${minS}°C to ${Math.max(...win.map((w) => w.spread))}°C`,
    );
    console.log(`- **Max Wind**: ${maxW} km/h`);
    console.log(``);

    console.log(
      `| Time | Temp (°C) | Dew Point (°C) | Spread (°C) | Wind (km/h) | Precip (mm) |`,
    );
    console.log(`|---|---|---|---|---|---|`);
    // Sample evenly or show key hours if long window
    const step = win.length > 24 ? Math.ceil(win.length / 12) : 1;
    for (let j = 0; j < win.length; j += step) {
      const row = win[j];
      console.log(
        `| ${row.time} | ${row.temp} | ${row.dew} | ${row.spread} | ${row.wind} | ${row.precip} |`,
      );
    }
    if (step > 1 && (win.length - 1) % step !== 0) {
      const row = win[win.length - 1];
      console.log(
        `| ${row.time} | ${row.temp} | ${row.dew} | ${row.spread} | ${row.wind} | ${row.precip} |`,
      );
    }
    console.log(``);
  });
}

main().catch((err) => {
  console.error("Scan error:", err.message);
  process.exit(1);
});
