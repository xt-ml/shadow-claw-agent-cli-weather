# 🌤️ [ShadowClaw Agent CLI Weather](https://xt-ml.github.io/shadow-claw-agent-cli-weather/)

[![ShadowClaw Agent](https://img.shields.io/badge/Agent-ShadowClaw_CLI-6366f1?style=flat&logo=gnubash)](https://github.com/xt-ml/shadow-claw)
[![Model Agnostic](https://img.shields.io/badge/Model-Agnostic-3b82f6?style=flat)](https://github.com/xt-ml/shadow-claw-agent-cli-weather)
[![Open-Meteo](https://img.shields.io/badge/Weather_Data-Open--Meteo-f59e0b?style=flat)](https://open-meteo.com)
[![Agent Skills](https://img.shields.io/badge/Agent_Skills-Discovery-8b5cf6?style=flat)](.well-known/agent-skills/index.json)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

A lightweight, modular, headless weather station, multi-day forecasting engine, and outdoor operational advisor built for practical forecasting workflows. Powered by [ShadowClaw](https://github.com/xt-ml/shadow-claw) headless CLI agents, [Open-Meteo](https://open-meteo.com), and standard Unix streams.

Fully model-agnostic: works seamlessly with any configured model provider (including local models via Ollama or Transformers.js, or cloud providers such as OpenRouter, Anthropic, or OpenAI).

---

<!-- WEATHER_REPORT_START -->
## 🌤️ Live Automated Weather Briefing — Chicago, IL

> [!NOTE]
> **Station Operational Status**: Active — Updated every 6 hours via GitHub Actions cron.
> 📍 **Station Reference**: Chicago, Illinois, United States (`41.8781°N, 87.6298°W`)
> 🤖 **Inference Engine**: `onnx-community/gemma-4-E2B-it-ONNX` (Transformers.js Local)
> 📦 **Raw Data Asset**: [`reports/weather-data.json`](reports/weather-data.json) · **Briefing Markdown**: [`reports/weather-update.md`](reports/weather-update.md)

<details open>
<summary><strong>📋 View Latest Weather Briefing (Sep 25, 2026)</strong></summary>

# Weather Briefing — Chicago, Illinois, United States — Friday, September 25, 2026 — 11:16 AM CDT

## 1. 🌡️ Current Conditions

- Station Observation Time: **11:16 AM CDT on Friday, September 25, 2026** (local time)
- Temperature & Feels-like: 60.2°F, Feels like 58.5°F, Mostly Cloudy, 73% Humidity, Dew Point 51.5°F, Wind 5.2 mph from the East, with gusts up to 7.4 mph.
- Precipitation Today: 0.0 inches

## 2. 🌬️ Air Quality & UV

- European AQI: 36 (Good)
- PM2.5: 7.3 μg/m³
- PM10: 7.4 μg/m³
- UV Index: 1.65 (Low to Moderate) - Sun protection is generally not required for brief exposure, but be mindful if spending long periods outdoors.

## 3. 📅 7-Day Forecast Highlights

| Date   | Condition     | High (°F) | Low (°F) | Precip (in) | Wind / Gusts (mph)                                     |
| :----- | :------------ | :-------- | :------- | :---------- | :----------------------------------------------------- |
| Sep 25 | Cloudy        | 63.2°F    | 55.9°F   | 0.0         | Wind up to 11 mph gusts                                |
| Sep 26 | Cloudy        | 63.9°F    | 52.9°F   | 0.0         | Wind up to 12.8 mph gusts                              |
| Sep 27 | Cloudy        | 67.6°F    | 52.6°F   | 0.0         | Wind up to 10.7 mph gusts                              |
| Sep 28 | Cloudy        | 68.9°F    | 59.3°F   | 0.0         | Wind up to 9.8 mph gusts                               |
| Sep 29 | Partly Cloudy | 70.5°F    | 58.6°F   | 0.06 inches | Wind up to 25.3 mph gusts (Potential for strong winds) |
| Sep 30 | Cloudy        | 68.7°F    | 62.5°F   | 0.53 inches | Strong winds up to 37.8 mph gusts                      |
| Oct 01 | Cloudy        | 66.7°F    | 64.2°F   | 0.84 inches | Wind up to 34.7 mph gusts                              |

**Notable Weather Events:** Expect increasing chances of precipitation toward the end of the week, with the heaviest rain/showers forecasted for September 30th and October 1st. Be prepared for potentially strong wind gusts, especially on the 30th and 1st.

## 4. 🚜 Practical Living Advice (Chicago, Illinois, United States — September 2026)

**Yard & Garden Advice:**

- **Soil Condition:** The soil should be moist from recent weather, but be mindful of potential saturation due to the forecasted rain.
- **Frost Risk:** Frost risk is currently low, but temperatures are fluctuating. Keep an eye on overnight lows, as they dip into the low 50s, which is still cool.
- **Watering Needs:** Water deeply if plants are showing signs of stress, especially leading into the predicted rain events.

**Travel & Driving Outlook:**

- **Highway Conditions:** Be cautious of potential slick roads due to recent and upcoming rainfall.
- **Wind/Ice/Fog Watch:** High wind gusts are forecasted, particularly on the 29th and 30th. Drivers should exercise extra caution when driving, especially on exposed routes, due to potential high winds.

**Clothing Recommendation for Today:**

- Dress in layers. The current temperature is mild, but the high of 63°F and the cool dew point suggest that mornings and evenings will feel quite cool.
- Bring a light jacket or sweater for comfort, especially if you are outdoors for extended periods. Prepare for cooler conditions as the week progresses.

</details>
<!-- WEATHER_REPORT_END -->

---

## ✨ Key Capabilities

- 🤖 **Automated CLI Agent**: Autonomous batch weather retrieval, data synthesis, and actionable outdoor advisories driven by ShadowClaw CLI.
- 🎯 **Precision Tool Scoping**: Avoids prompt and schema bloat by explicitly scoping tools (`--tools "fetch_url"` for retrieval, `--tools none` for downstream synthesis). Keeps token consumption minimal and execution deterministic.
- ⏱️ **Operational Window Scanner**: Hourly condition evaluator (`bin/scan-window.mjs`) parses 168+ consecutive forecast hours to identify exact windows meeting custom criteria (e.g., temperature thresholds, dew point spread, duration).
- 🔗 **Unix Pipe Composability**: Chain report outputs directly into subsequent agent queries using standard Unix pipelines (`./bin/weather-now.sh | ./bin/weather-ask.sh "Do I need a coat?"`).
- 🌍 **Location Agnostic**: Out-of-the-box fallback to **Chicago, Illinois**, with instant geocoding resolution for any global location and persistent default location configuration.
- 🌐 **Well-Known Agent Skills Discovery**: Publishes standardized declarative tools and skills over HTTPS for external autonomous agents and remote discovery clients at `https://xt-ml.github.io/shadow-claw-agent-cli-weather/.well-known/agent-skills/index.json`.
- 📥 **CLI Agent Import Compatible**: Compatible with `shadow-claw agent import`—any external ShadowClaw agent can discover, import, and execute these weather tools natively with a single command.

---

## 🚀 Quick Start

### 1. Initialize Your ShadowClaw Agent

ShadowClaw CLI lets you configure your preferred inference provider on first run:

```bash
# Initialize workspace agent (select your preferred provider and model)
npx shadow-claw agent init
```

> 💡 **Model Selection**: You can configure any supported provider during initialization (including OpenRouter, Ollama, Anthropic, OpenAI, or any OpenAI-compatible endpoint).

### 2. Run Instant Weather Reports

```bash
# Current conditions for default location (Chicago, IL)
./bin/weather-now.sh

# 7-day forecast for Chicago
./bin/weather-forecast.sh

# On-the-fly query for any global location
./bin/weather-now.sh "New York, New York, United States"
```

### 3. Generate HTML for GitHub Pages

Whenever `README.md` or tools change, regenerate the static `index.html`:

```bash
./bin/build-html.mjs
```

---

## 🛠️ Script Catalog

All executable scripts reside in [`bin/`](bin) and save structured markdown outputs into [`reports/`](reports):

| Script                                                               | Output File                    | Description                                                                              |
| -------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| [`./bin/set-default-location.sh [loc]`](bin/set-default-location.sh) | `.cache/default-location.json` | View, update, or reset (`--reset`) the persistent default location.                      |
| [`./bin/resolve-location.mjs [loc]`](bin/resolve-location.mjs)       | `stdout`                       | Core location resolver and Open-Meteo geocoding utility.                                 |
| [`./bin/scan-window.mjs "<query>"`](bin/scan-window.mjs)             | `stdout`                       | Hourly condition scanner (temp, dew point spread, duration).                             |
| [`./bin/summarize-forecast.mjs [loc]`](bin/summarize-forecast.mjs)   | `stdout`                       | Node.js forecast ingestion and summary generator for agents.                             |
| [`./bin/build-html.mjs`](bin/build-html.mjs)                         | `index.html`                   | Compiles README.md and well-known skills into standalone static HTML.                    |
| [`./bin/weather-now.sh [loc]`](bin/weather-now.sh)                   | `reports/weather-now.md`       | Real-time conditions (temperature, feels-like, humidity, dew point, wind & gusts).       |
| [`./bin/weather-forecast.sh [days] [loc]`](bin/weather-forecast.sh)  | `reports/weather-forecast.md`  | Multi-day forecast (1–16 days, default 7) with highs, lows, rain, wind, sunrise/sunset.  |
| [`./bin/weather-window.sh "<query>" [loc]`](bin/weather-window.sh)   | `reports/weather-window.md`    | Scans hourly forecast for operational windows (e.g., temp > 2°C & dew spread > 3°C).     |
| [`./bin/weather-ask.sh "<question>" [loc]`](bin/weather-ask.sh)      | `stdout`                       | Piped follow-up query engine running `--tools none` with zero context noise.             |
| [`./bin/weather-yard.sh [task] [loc]`](bin/weather-yard.sh)          | `reports/weather-yard.md`      | Outdoor project advice (lawn care, fence painting, garden protection, soil moisture).    |
| [`./bin/weather-travel.sh [trip] [loc]`](bin/weather-travel.sh)      | `reports/weather-travel.md`    | Highway driving conditions, crosswind hazards, and travel advice.                        |
| [`./bin/weather-seasonal.sh [loc]`](bin/weather-seasonal.sh)         | `reports/weather-seasonal.md`  | Seasonal milestones, first/last frost risk, freeze-up timelines, and prep checklists.    |
| [`./bin/weather-update.sh [loc]`](bin/weather-update.sh)             | `reports/weather-update.md`    | Comprehensive daily briefing combining current weather, 7-day forecast, and air quality. |

---

## 🌐 Shared Well-Known Agent Skills & Declarative Tools

This repository publishes and advertises standardized declarative tools and skills exclusively for external AI agents, autonomous clients, and remote systems via well-known agent skills discovery.

> [!NOTE]
> **Outbound Skill Advertising Only**: This workspace operates as a standalone headless weather station and CLI operational advisor. The discovery manifest and declarative tools hosted here exist solely for advertising our capabilities to external agents and remote systems—this workspace does not import or execute external third-party skills internally.

### Published Discovery Endpoint

The canonical public endpoint advertised for external consumers is:

```
https://xt-ml.github.io/shadow-claw-agent-cli-weather/.well-known/agent-skills/index.json
```

### Declarative Tools Catalog

The repository exposes four sandboxed, zero-dependency declarative JavaScript tools in [`.agents/tools/main/`](.agents/tools/main/):

| Tool Name                | Source File                                                                                        | Description                                                                                                                                   | Inputs                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `get_current_weather`    | [`.agents/tools/main/get_current_weather.json`](.agents/tools/main/get_current_weather.json)       | Real-time weather conditions via Open-Meteo API (temperature, feels-like, humidity, wind speed, gusts, precipitation, cloud cover, WMO code). | `latitude`, `longitude`, `timezone`, `temperature_unit`                  |
| `get_weather_forecast`   | [`.agents/tools/main/get_weather_forecast.json`](.agents/tools/main/get_weather_forecast.json)     | Multi-day (1–16 days) forecast with hourly metrics (dew point, humidity, rain probability, wind) and daily highs, lows, and sunrise/sunset.   | `latitude`, `longitude`, `timezone`, `forecast_days`, `temperature_unit` |
| `get_air_quality`        | [`.agents/tools/main/get_air_quality.json`](.agents/tools/main/get_air_quality.json)               | Current and hourly air quality (European AQI, PM2.5, PM10, UV index, clear sky UV) via Open-Meteo Air Quality API.                            | `latitude`, `longitude`, `timezone`                                      |
| `lookup_location_coords` | [`.agents/tools/main/lookup_location_coords.json`](.agents/tools/main/lookup_location_coords.json) | Forward geocoding to resolve any place name to latitude, longitude, and elevation via Open-Meteo Geocoding API.                               | `name` (required), `count`                                               |

In addition, the bundled ShadowClaw skill **`skill-creator`** is indexed for creating, authoring, and validating skills.

### Remote Agent Discovery & Inspection

External autonomous agents and discovery clients can inspect our published capabilities directly over HTTPS:

```bash
# Fetch and inspect the live discovery index
curl -s https://xt-ml.github.io/shadow-claw-agent-cli-weather/.well-known/agent-skills/index.json | jq .

# Inspect an individual declarative tool manifest directly
curl -s https://xt-ml.github.io/shadow-claw-agent-cli-weather/.agents/tools/main/get_current_weather.json | jq .
```

### 📥 Importing into External ShadowClaw CLI Agents

External ShadowClaw agents can import our published declarative tools directly using the CLI `agent import` command:

```bash
# 1. Import all published weather tools and skills directly into your agent workspace
npx shadow-claw agent import https://xt-ml.github.io/shadow-claw-agent-cli-weather/

# Or import from the explicit discovery endpoint
npx shadow-claw agent import https://xt-ml.github.io/shadow-claw-agent-cli-weather/.well-known/agent-skills/index.json

# 2. Selectively import specific tools
npx shadow-claw agent import https://xt-ml.github.io/shadow-claw-agent-cli-weather/ --tools "get_current_weather,get_weather_forecast"

# 3. List tools in your agent workspace to verify
npx shadow-claw agent tools

# 4. Inspect an imported declarative tool definition
npx shadow-claw agent tool get_current_weather

# 5. Execute an imported tool directly from the CLI
npx shadow-claw agent tool get_current_weather '{"latitude": 41.8781, "longitude": -87.6298}'

# 6. Run an agent prompt with the imported tool enabled
npx shadow-claw agent run --tools "get_current_weather" "What is the current temperature and conditions in Chicago?"
```

---

## 📖 Usage Examples

### 1. Current Conditions

```bash
# Check current weather for default location (Chicago, IL)
./bin/weather-now.sh

# Check current weather for New York
./bin/weather-now.sh "New York, New York, United States"

# Or use the --location flag
./bin/weather-now.sh --location "London, United Kingdom"
```

### 2. Multi-Day Forecasts

```bash
# 7-day forecast for default location
./bin/weather-forecast.sh

# 3-day forecast for New York
./bin/weather-forecast.sh 3 "New York, New York, United States"

# 14-day extended outlook for Chicago
./bin/weather-forecast.sh 14
```

### 3. Persistent Default Location Management

Configure your home station once—all scripts will respect it automatically:

```bash
# View active default location
./bin/set-default-location.sh

# Change persistent default to New York
./bin/set-default-location.sh "New York, New York, United States"

# Reset back to factory default (Chicago, IL)
./bin/set-default-location.sh --reset
```

### 4. Operational Window Scanner (Cold-Sensitive & Exterior Tasks)

Identify exact multi-hour windows meeting strict operational criteria across 168 forecast hours:

```bash
# Find a 24-hour window above 2°C with at least 3°C dew point spread (exterior staining/curing):
./bin/weather-window.sh "temperature above 2C and at least 3C above the dew point for 24 hours"

# Find calm, dry windows for aerial spraying or lawn seeding:
./bin/weather-window.sh "no precipitation and wind under 15 km/h" "Chicago, Illinois"
```

### 5. Unix Pipe Composability & Zero-Noise Follow-Ups

Ask follow-up questions on existing data without re-fetching or wasting tokens:

```bash
# Pipe current weather snapshot into ask engine:
cat reports/weather-now.md | ./bin/weather-ask.sh "Do I need a warm jacket this evening?"

# Pipe 7-day forecast to find the best day for outdoor projects:
cat reports/weather-forecast.md | ./bin/weather-ask.sh "Which day this week has the lowest wind and zero rain?"

# Chain current weather directly into a clothing recommendation:
./bin/weather-now.sh | ./bin/weather-ask.sh "Give me a 1-sentence commuter recommendation."
```

### 6. Highway Travel & Road Hazards

```bash
# General driving hazard outlook from Chicago
./bin/weather-travel.sh

# Specific corridor check
./bin/weather-travel.sh "drive to Milwaukee via I-94"
./bin/weather-travel.sh "drive to Indianapolis via I-65"
```

### 7. External CLI Agent Integration (Import & Zero-Code Tooling)

Any standalone or remote ShadowClaw agent can import and use our weather station tools without cloning the repository or writing integration glue:

```bash
# In your own agent's project or workspace:
npx shadow-claw agent import https://xt-ml.github.io/shadow-claw-agent-cli-weather/

# Query Chicago weather directly via the imported declarative tool
npx shadow-claw agent tool get_current_weather

# Query forecast for custom coordinates (e.g. New York: 40.7128, -74.0060)
npx shadow-claw agent tool get_weather_forecast '{"latitude": 40.7128, "longitude": -74.006, "forecast_days": 3}'

# Ask the agent for weather analysis using the imported tools
npx shadow-claw agent run --tools "get_current_weather,get_weather_forecast" "Compare current conditions with the 3-day forecast outlook"
```

---

## ⚙️ Architecture & Operational Principles

### 1. Explicit Tool Scoping (`--tools`)

When executing batch agent steps with `shadow-claw agent run`, injecting all default built-in tools balloons context tokens and can cause models to execute unnecessary tools.

- **Data Ingestion Step**: Passes strictly `--tools "fetch_url"`. The agent calls Open-Meteo, ingests raw data, formats markdown, and exits.
- **Synthesis / Follow-Up Step**: Passes `--tools none`. All tool schemas are stripped from the prompt, leaving 100% of context capacity for weather reports and instant synthesis.

### 2. Lightweight Node.js Processing

All geocoding, coordinate transformation, hourly condition scans, and static site rendering run directly in standard Node.js scripts (`bin/resolve-location.mjs`, `bin/scan-window.mjs`, `bin/summarize-forecast.mjs`, `bin/build-html.mjs`) without extra external dependencies.

### 3. Declarative Tools & Sandboxed Execution

Declarative tool manifests in [`.agents/tools/main/`](.agents/tools/main) use standard JSON schemas and JavaScript execution definitions. They run deterministically inside worker sandboxes without granting unrestricted OS shell privileges.

### 4. Static Hosting on GitHub Pages with `.nojekyll`

Because GitHub Pages defaults to Jekyll, dot-directories (`.well-known` and `.agents`) would otherwise be suppressed. The root `.nojekyll` file ensures direct public access to discovery schemas and tool definitions. Pre-rendering `index.html` guarantees instant browser viewing without requiring Jekyll compilation.

---

## License

AGPL-3.0
