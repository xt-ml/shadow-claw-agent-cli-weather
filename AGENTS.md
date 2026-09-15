# AGENTS.md — ShadowClaw Agent CLI Weather

> **Instructions for AI Agents** working in `shadow-claw-agent-cli-weather`.

---

## 🎯 Workspace Mission

This directory is an automated, headless weather station, forecast generator, and outdoor operational advisor powered by [ShadowClaw](../../shadow-claw) and the [Open-Meteo API](https://open-meteo.com). It executes batch CLI agent workflows using any configured model provider (such as Ollama, Transformers.js, OpenRouter, Anthropic, or OpenAI).

---

## ⚠️ Non-Negotiable Rules & Guardrails

### 1. Model Selection: Model-Agnostic & Config-Governed

- The agent is fully model-agnostic.
- **Never hardcode provider or model flags inside shell scripts**: allow `shadow-claw.config.json`, interactive initialization (`npx shadow-claw agent init`), or user environment variables (`LLM_PROVIDER`, `MODEL_NAME`) to govern execution.

### 2. Context Noise Reduction: Explicitly Pass Tools

- **Never invoke `shadow-claw agent run` without `--tools`**:
  - Unscoped invocations inject all 30+ default built-in tools into the system prompt.
  - This balloons token counts, exceeds compact local model context windows, introduces latency, and risks unprompted tool reasoning loops.
- **For weather retrieval calls**: Pass **only** the exact required tool:

  ```bash
  --tools "fetch_url"
  ```

  Do NOT add `get_current_time`, `update_memory`, or auxiliary tools unless strictly required. Restricting tool availability ensures fast, deterministic single-step execution.

- **For follow-ups, summarization, and analysis on existing reports**: Pass:

  ```bash
  --tools none
  ```

  (or `--no-tools`). This completely strips tool schemas from the prompt, leaving 100% of the context window available for weather data and synthesis.

### 3. Unix Pipes for Follow-Up Questions

- Do **not** trigger full agent re-runs or re-fetch remote API data to answer follow-up questions.
- Pass existing reports via standard input using unix pipes:

  ```bash
  cat reports/weather-now.md | ./bin/weather-ask.sh "<follow-up question>"
  # or
  cat reports/weather-forecast.md | npx shadow-claw agent run --tools none -y "<question>"
  ```

### 4. System Prompt Integrity (`.cache/MEMORY.md`)

- Keep `.cache/MEMORY.md` concise, direct, and factual.
- **NEVER** insert conversational constraints like _"Always greet the user and state the time"_ into `.cache/MEMORY.md`. In headless CLI runs (`shadow-claw agent run`), conversational greetings can cause the model to output small talk and terminate before executing tools.
- Keep location coordinates (`41.8781`, `-87.6298`) and API endpoint templates cleanly documented in `.cache/MEMORY.md`.

### 5. Node.js & Tooling Environment

Use `npx shadow-claw` directly for CLI commands; avoid hardcoding absolute workstation paths.

### 6. Standard Node.js Scripts

All JSON manipulation, geocoding lookups, and CLI data processing are performed using standard Node.js scripts (such as `bin/resolve-location.mjs` or `bin/scan-window.mjs`). Avoid introducing unnecessary third-party CLI dependencies.

### 7. Location Agnosticism & Defaults

All weather scripts in `bin/` are location-agnostic:

- **Default Location**: Stored in `.cache/default-location.json` (inspected and updated via `bin/set-default-location.sh`). If absent, defaults to Chicago, Illinois, United States.
- **On-the-Fly Lookups**: Pass any location string (e.g. `"New York, New York, United States"` or `"London, United Kingdom"`) or use `--location "<string>"`.
- **Resolution**: Handled cleanly via `bin/resolve-location.mjs`, which queries Open-Meteo's geocoding endpoint and exports `LOC_NAME`, `LOC_LAT`, `LOC_LON`, `LOC_TZ`, and `LOC_TZ_ENCODED`.

### 8. GitHub Pages Publishing, `.nojekyll`, and Pre-Rendered `index.html`

This workspace is published directly to GitHub Pages from the root of the branch:

- **`.nojekyll`**: A root `.nojekyll` file MUST be preserved. It prevents GitHub Pages from running Jekyll processing, allowing dot-directories (`.well-known/agent-skills/` and `.agents/tools/`) to be served directly as static JSON assets over HTTPS for the Agent Skills Discovery format.
- **Published Endpoint**: The canonical live discovery URL is `https://xt-ml.github.io/shadow-claw-agent-cli-weather/.well-known/agent-skills/index.json`. Do not advertise or use other URLs.
- **Outbound Advertising Only**: The skills index and associated declarative tools exist exclusively for advertising our capabilities to external agents and remote systems. This workspace operates as a standalone CLI weather station and does not import skills.
- **Static `index.html`**: Because `.nojekyll` disables Jekyll's automatic markdown rendering, `index.html` must be kept pre-rendered at the repository root so web browsers and clients can view the complete documentation and interactive tool showcase.
- **Regenerating `index.html`**: Whenever `README.md` or declarative tool schemas are updated, run `./bin/build-html.mjs` to regenerate `index.html`.

---

## 📍 Primary Location Reference (Factory Fallback)

| Parameter           | Value                                       |
| ------------------- | ------------------------------------------- |
| **Location**        | Chicago, Illinois, United States            |
| **Latitude**        | `41.8781`                                   |
| **Longitude**       | `-87.6298`                                  |
| **Elevation**       | ~181 m                                      |
| **Timezone**        | `America/Chicago`                           |
| **Climate Context** | Humid continental; Lake Michigan moderation |

---

## 🛠️ Script Roster

When modifying or adding scripts, adhere to the pattern established in these files:

- **[`bin/resolve-location.mjs`](bin/resolve-location.mjs)**: Geocoding & coordinate resolution utility.
- **[`bin/scan-window.mjs`](bin/scan-window.mjs)**: Hourly weather window scanner.
- **[`bin/summarize-forecast.mjs`](bin/summarize-forecast.mjs)**: Forecast ingestion and summarization helper.
- **[`bin/build-html.mjs`](bin/build-html.mjs)**: Standalone README and agent skills to `index.html` compiler.
- **[`bin/set-default-location.sh`](bin/set-default-location.sh)**: Inspect, update, or reset persistent default location.
- **[`bin/weather-now.sh`](bin/weather-now.sh)**: Current conditions snapshot -> `reports/weather-now.md`.
- **[`bin/weather-forecast.sh`](bin/weather-forecast.sh)**: Multi-day forecast (default 7 days) -> `reports/weather-forecast.md`.
- **[`bin/weather-window.sh`](bin/weather-window.sh)**: Hourly condition-matching (e.g. spray windows, drying windows, frost thresholds) -> `reports/weather-window.md`.
- **[`bin/weather-ask.sh`](bin/weather-ask.sh)**: Zero-noise follow-up question runner (`--tools none`, pipes stdin).
- **[`bin/weather-yard.sh`](bin/weather-yard.sh)**: Yard, garden, and property maintenance advice -> `reports/weather-yard.md`.
- **[`bin/weather-travel.sh`](bin/weather-travel.sh)**: Highway travel and driving advice -> `reports/weather-travel.md`.
- **[`bin/weather-seasonal.sh`](bin/weather-seasonal.sh)**: Seasonal timeline, freeze-up, and frost guidance -> `reports/weather-seasonal.md`.
- **[`bin/weather-update.sh`](bin/weather-update.sh)**: Comprehensive daily weather briefing -> `reports/weather-update.md`.
