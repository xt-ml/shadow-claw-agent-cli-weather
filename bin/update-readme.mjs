#!/usr/bin/env node
// bin/update-readme.mjs — Injects latest weather report into README.md between sentinel comments

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const readmePath = path.join(rootDir, "README.md");

const defaultCandidates = [
  path.join(rootDir, "reports", "weather-update.md"),
  path.join(rootDir, ".cache", "assets", "weather-briefing.md"),
];

let reportPath = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!reportPath) {
  reportPath = defaultCandidates.find((p) => fs.existsSync(p)) || null;
}

const START_MARKER = "<!-- WEATHER_REPORT_START -->";
const END_MARKER = "<!-- WEATHER_REPORT_END -->";

if (!fs.existsSync(readmePath)) {
  console.error(`Error: README.md not found at ${readmePath}`);
  process.exit(1);
}

if (!reportPath || !fs.existsSync(reportPath)) {
  console.log("ℹ️  No generated report found in reports/weather-update.md.");
  console.log(
    "   Run `npm run weather:update` to generate the briefing first.",
  );
  process.exit(0);
}

const readmeContent = fs.readFileSync(readmePath, "utf8");
let reportContent = fs.readFileSync(reportPath, "utf8").trim();

if (!reportContent) {
  console.error("Error: Report file is empty.");
  process.exit(1);
}

const startIndex = readmeContent.indexOf(START_MARKER);
const endIndex = readmeContent.indexOf(END_MARKER);

const formattedReportBlock = `${START_MARKER}
## 🌤️ Live Automated Weather Briefing — Chicago, IL

> [!NOTE]
> **Station Operational Status**: Active — Updated every 6 hours via GitHub Actions cron.
> 📍 **Station Reference**: Chicago, Illinois, United States (\`41.8781°N, 87.6298°W\`)
> 🤖 **Inference Engine**: \`onnx-community/gemma-4-E2B-it-ONNX\` (Transformers.js Local)
> 📦 **Raw Data Asset**: [\`reports/weather-data.json\`](reports/weather-data.json) · **Briefing Markdown**: [\`reports/weather-update.md\`](reports/weather-update.md)

<details open>
<summary><strong>📋 View Latest Weather Briefing (${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" })})</strong></summary>

${reportContent}

</details>
${END_MARKER}`;

let updatedReadme = "";

if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
  updatedReadme =
    readmeContent.slice(0, startIndex) +
    formattedReportBlock +
    readmeContent.slice(endIndex + END_MARKER.length);
} else {
  // Insert directly above Key Capabilities
  const targetInsertion = "## ✨ Key Capabilities";
  if (readmeContent.includes(targetInsertion)) {
    updatedReadme = readmeContent.replace(
      targetInsertion,
      `${formattedReportBlock}\n\n---\n\n${targetInsertion}`,
    );
  } else {
    updatedReadme = `${formattedReportBlock}\n\n---\n\n${readmeContent}`;
  }
}

fs.writeFileSync(readmePath, updatedReadme, "utf8");
console.log(
  `✅ Successfully injected latest weather report into ${readmePath}`,
);
