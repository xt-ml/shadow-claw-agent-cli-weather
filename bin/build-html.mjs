#!/usr/bin/env node

// bin/build-html.mjs — Renders README.md into a high-density, beautifully styled, readable index.html for GitHub Pages

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const readmePath = path.join(rootDir, "README.md");
const outputPath = path.join(rootDir, "index.html");
if (!fs.existsSync(readmePath)) {
  console.error(`Error: README.md not found at ${readmePath}`);
  process.exit(1);
}

const readmeContent = fs.readFileSync(readmePath, "utf-8");

/**
 * Escapes HTML special characters.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Configure custom marked renderer
const renderer = new marked.Renderer();

// Headings with slugs and permalink anchors
renderer.heading = function (token) {
  const text = this.parser.parseInline(token.tokens);
  const slug = token.text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu,
      "",
    )
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return `<h${token.depth} id="${slug}" class="heading-anchor-wrapper">
  <span>${text}</span>
  <a href="#${slug}" class="heading-anchor" aria-label="Direct link to ${escapeHtml(token.text)}">#</a>
</h${token.depth}>\n`;
};

// Code blocks with syntax badge and copy button
renderer.code = function (token) {
  const escaped = escapeHtml(token.text);
  const langDisplay = token.lang ? escapeHtml(token.lang.trim()) : "text";
  return `<div class="code-block-wrapper">
  <div class="code-block-header">
    <span class="code-lang-badge">${langDisplay}</span>
    <button class="copy-code-btn" type="button" aria-label="Copy code to clipboard" data-code="${encodeURIComponent(token.text)}">
      <svg class="copy-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      <span class="copy-text">Copy</span>
    </button>
  </div>
  <pre><code class="language-${langDisplay}">${escaped}</code></pre>
</div>\n`;
};

// Responsive, styled tables
renderer.table = function (token) {
  let header = "";
  for (const cell of token.header) {
    header += this.tablecell(cell);
  }
  let body = "";
  for (const row of token.rows) {
    body += "<tr>\n";
    for (const cell of row) {
      body += this.tablecell(cell);
    }
    body += "</tr>\n";
  }
  return `<div class="table-container">\n<table>\n<thead>\n<tr>\n${header}</tr>\n</thead>\n<tbody>\n${body}</tbody>\n</table>\n</div>\n`;
};

// Links with automatic external target attributes
renderer.link = function (token) {
  const isExternal =
    token.href.startsWith("http://") || token.href.startsWith("https://");
  const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
  return `<a href="${escapeHtml(token.href)}"${target}>${this.parser.parseInline(token.tokens)}</a>`;
};

// Lazy loaded images with inline badge class
renderer.image = function (token) {
  return `<img src="${escapeHtml(token.href)}" alt="${escapeHtml(token.text || "")}" loading="lazy" class="inline-img" />`;
};

// GitHub style callout alerts (> [!NOTE], > [!TIP], etc.)
renderer.blockquote = function (token) {
  const text = token.text || "";
  const match = text.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
  if (match) {
    const alertType = match[1].toLowerCase();
    let body = this.parser.parse(token.tokens);
    body = body.replace(
      /^\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(<br\s*\/?>)?/i,
      "<p>",
    );
    let icon = "ℹ️";
    if (alertType === "tip") icon = "💡";
    if (alertType === "important") icon = "📌";
    if (alertType === "warning") icon = "⚠️";
    if (alertType === "caution") icon = "🚨";
    return `<div class="callout callout-${alertType}" role="note">
  <div class="callout-header">
    <span class="callout-icon">${icon}</span>
    <span class="callout-title">${alertType.toUpperCase()}</span>
  </div>
  <div class="callout-body">${body}</div>
</div>\n`;
  }
  return `<blockquote>\n${this.parser.parse(token.tokens)}\n</blockquote>\n`;
};

marked.use({ renderer });
const renderedHtml = marked.parse(readmeContent);

// Generate the complete HTML document
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ShadowClaw Agent CLI Weather — Headless Station, Forecasting & Well-Known Agent Skills</title>
  <meta name="description" content="A lightweight, modular, headless weather station, multi-day forecasting engine, and outdoor operational advisor powered by ShadowClaw CLI, Open-Meteo, and well-known agent skills discovery.">
  <meta name="theme-color" content="#0b0f19">
  <meta property="og:title" content="ShadowClaw Agent CLI Weather">
  <meta property="og:description" content="Automated CLI weather engine, condition window scanner, and shared Agent Skills & Tools host on GitHub Pages (.nojekyll).">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg-canvas: #0b0f19;
      --bg-surface: #111827;
      --bg-surface-elevated: #1f2937;
      --bg-surface-hover: #374151;
      --border-subtle: #1f2937;
      --border-prominent: #374151;
      --text-main: #f9fafb;
      --text-muted: #9ca3af;
      --text-subtle: #6b7280;
      --accent-primary: #38bdf8;
      --accent-primary-glow: rgba(56, 189, 248, 0.12);
      --accent-secondary: #818cf8;
      --accent-warning: #f59e0b;
      --accent-success: #10b981;
      --accent-danger: #ef4444;
      --code-bg: #0d1321;
      --code-border: #1f2937;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --content-max-width: 980px;
    }

    [data-theme="light"] {
      --bg-canvas: #f9fafb;
      --bg-surface: #ffffff;
      --bg-surface-elevated: #f3f4f6;
      --bg-surface-hover: #e5e7eb;
      --border-subtle: #e5e7eb;
      --border-prominent: #d1d5db;
      --text-main: #111827;
      --text-muted: #4b5563;
      --text-subtle: #9ca3af;
      --accent-primary: #0284c7;
      --accent-primary-glow: rgba(2, 132, 199, 0.1);
      --accent-secondary: #6366f1;
      --accent-warning: #d97706;
      --accent-success: #059669;
      --accent-danger: #dc2626;
      --code-bg: #111827;
      --code-border: #e5e7eb;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      scroll-behavior: smooth;
      font-size: 16px;
      overflow-x: hidden;
      max-width: 100%;
    }

    body {
      background-color: var(--bg-canvas);
      color: var(--text-main);
      font-family: var(--font-sans);
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      transition: background-color 0.2s ease, color 0.2s ease;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      width: 100%;
      max-width: 100%;
      position: relative;
    }

    /* Ambient background gradient glow */
    body::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      max-width: 100%;
      height: 480px;
      background: radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.08), transparent 70%),
                  radial-gradient(circle at 80% 10%, rgba(129, 140, 248, 0.06), transparent 60%);
      pointer-events: none;
      z-index: -1;
    }

    /* Top Sticky Header */
    .site-header {
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      background-color: rgba(17, 24, 39, 0.9);
      border-bottom: 1px solid var(--border-subtle);
      width: 100%;
      max-width: 100%;
    }

    [data-theme="light"] .site-header {
      background-color: rgba(255, 255, 255, 0.94);
    }

    .header-inner {
      max-width: var(--content-max-width);
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
      color: var(--text-main);
      font-weight: 700;
      font-size: 1.05rem;
      letter-spacing: -0.01em;
      white-space: nowrap;
    }

    .brand-icon {
      font-size: 1.35rem;
      line-height: 1;
    }

    /* Center Quick-Jump Links */
    .nav-links-center {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      list-style: none;
    }

    @media (max-width: 860px) {
      .nav-links-center {
        display: none;
      }
    }

    .nav-link {
      font-size: 0.825rem;
      font-weight: 500;
      color: var(--text-muted);
      text-decoration: none;
      padding: 0.35rem 0.65rem;
      border-radius: 0.375rem;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .nav-link:hover {
      color: var(--accent-primary);
      background-color: var(--accent-primary-glow);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.75rem;
      font-size: 0.825rem;
      font-weight: 500;
      color: var(--text-muted);
      background-color: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 0.45rem;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .nav-btn:hover {
      color: var(--text-main);
      background-color: var(--bg-surface-hover);
      border-color: var(--border-prominent);
    }

    .theme-toggle-btn {
      padding: 0.4rem 0.55rem;
    }

    /* Main Content Container (Content-First Single Column) */
    .main-wrapper {
      max-width: var(--content-max-width);
      margin: 0 auto;
      padding: 2.5rem 1.5rem 5rem;
      width: 100%;
      flex: 1;
    }

    /* Markdown Typography */
    .markdown-body {
      font-size: 1.025rem;
      color: var(--text-main);
      line-height: 1.75;
    }

    .markdown-body h1 {
      font-size: 2.35rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.2;
      margin-bottom: 1.25rem;
      border-bottom: none;
      padding-bottom: 0;
    }

    .markdown-body h2 {
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-top: 3rem;
      margin-bottom: 1.15rem;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 0.5rem;
    }

    .markdown-body h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
    }

    .markdown-body h4 {
      font-size: 1.05rem;
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .heading-anchor-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .heading-anchor {
      color: var(--text-subtle);
      text-decoration: none;
      font-weight: 400;
      opacity: 0;
      transition: opacity 0.15s ease, color 0.15s ease;
    }

    .heading-anchor-wrapper:hover .heading-anchor {
      opacity: 1;
    }

    .heading-anchor:hover {
      color: var(--accent-primary);
    }

    .markdown-body p {
      margin-bottom: 1.25rem;
    }

    /* Shield / Badges Row */
    .markdown-body p:has(.inline-img) {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      align-items: center;
      margin-top: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .inline-img {
      vertical-align: middle;
      border-radius: 0.25rem;
    }

    .markdown-body a {
      color: var(--accent-primary);
      text-decoration: none;
      font-weight: 500;
      border-bottom: 1px solid transparent;
      transition: border-color 0.15s ease;
    }

    .markdown-body a:hover {
      border-bottom-color: var(--accent-primary);
    }

    .markdown-body hr {
      border: 0;
      border-top: 1px solid var(--border-subtle);
      margin: 2.75rem 0;
    }

    .markdown-body ul,
    .markdown-body ol {
      margin-bottom: 1.25rem;
      padding-left: 1.5rem;
    }

    .markdown-body li {
      margin-bottom: 0.45rem;
    }

    .markdown-body li > ul,
    .markdown-body li > ol {
      margin-top: 0.35rem;
      margin-bottom: 0;
    }

    /* Inline Code */
    .markdown-body code {
      font-family: var(--font-mono);
      font-size: 0.875em;
      padding: 0.2em 0.45em;
      border-radius: 0.35em;
      background-color: var(--bg-surface-elevated);
      color: var(--accent-primary);
      border: 1px solid var(--border-subtle);
    }

    .markdown-body pre code {
      padding: 0;
      background-color: transparent;
      color: inherit;
      border: none;
      font-size: inherit;
    }

    /* Code Blocks */
    .code-block-wrapper {
      position: relative;
      margin: 1.5rem 0;
      border-radius: 0.65rem;
      overflow: hidden;
      border: 1px solid var(--code-border);
      background-color: var(--code-bg);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      max-width: 100%;
      box-sizing: border-box;
    }

    .code-block-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.45rem 0.85rem;
      background-color: #1a2333;
      border-bottom: 1px solid #2d3748;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      color: #94a3b8;
    }

    .code-lang-badge {
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #94a3b8;
    }

    .copy-code-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background-color: #242f47;
      border: 1px solid #3b4c6e;
      color: #f8fafc;
      border-radius: 0.375rem;
      padding: 0.25rem 0.65rem;
      font-size: 0.775rem;
      font-family: var(--font-sans);
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
      transition: all 0.15s ease;
      line-height: 1.2;
    }

    .copy-code-btn .copy-icon {
      width: 13px;
      height: 13px;
      stroke: #f8fafc;
      stroke-width: 2.2;
    }

    .copy-code-btn:hover {
      background-color: #334155;
      border-color: #64748b;
      color: #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
    }

    .copy-code-btn:hover .copy-icon {
      stroke: #ffffff;
    }

    .copy-code-btn:focus-visible {
      outline: 2px solid var(--accent-primary);
      outline-offset: 2px;
    }

    .copy-code-btn.copied {
      background-color: #065f46;
      border-color: #10b981;
      color: #ecfdf5;
    }

    .copy-code-btn.copied .copy-icon {
      stroke: #a7f3d0;
    }

    .markdown-body pre {
      padding: 1.1rem 1.25rem;
      overflow-x: auto;
      font-family: var(--font-mono);
      font-size: 0.875rem;
      line-height: 1.6;
      color: #f1f5f9;
      scrollbar-width: thin;
      scrollbar-color: var(--border-prominent) transparent;
    }

    /* Tables */
    .table-container {
      width: 100%;
      overflow-x: auto;
      margin: 1.75rem 0;
      border-radius: 0.6rem;
      border: 1px solid var(--border-subtle);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      text-align: left;
      background-color: var(--bg-surface);
    }

    th {
      background-color: var(--bg-surface-elevated);
      color: var(--text-main);
      font-weight: 600;
      padding: 0.85rem 1.1rem;
      border-bottom: 1px solid var(--border-prominent);
      white-space: nowrap;
    }

    td {
      padding: 0.85rem 1.1rem;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-muted);
      vertical-align: top;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background-color: var(--bg-surface-hover);
    }

    /* Callouts / Alerts */
    .callout {
      border-left: 4px solid var(--accent-primary);
      background-color: var(--bg-surface);
      border-radius: 0 0.5rem 0.5rem 0;
      padding: 1rem 1.25rem;
      margin: 1.5rem 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      border-top: 1px solid var(--border-subtle);
      border-right: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
    }

    .callout-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.4rem;
    }

    .callout-note {
      border-left-color: var(--accent-primary);
      background: rgba(56, 189, 248, 0.05);
    }

    .callout-note .callout-header { color: var(--accent-primary); }

    .callout-tip {
      border-left-color: var(--accent-success);
      background: rgba(16, 185, 129, 0.05);
    }

    .callout-tip .callout-header { color: var(--accent-success); }

    .callout-important {
      border-left-color: var(--accent-secondary);
      background: rgba(129, 140, 248, 0.05);
    }

    .callout-important .callout-header { color: var(--accent-secondary); }

    .callout-warning {
      border-left-color: var(--accent-warning);
      background: rgba(245, 158, 11, 0.05);
    }

    .callout-warning .callout-header { color: var(--accent-warning); }

    blockquote {
      border-left: 4px solid var(--border-prominent);
      padding-left: 1.15rem;
      margin: 1.25rem 0;
      color: var(--text-muted);
      font-style: italic;
    }

    /* Footer */
    .site-footer {
      border-top: 1px solid var(--border-subtle);
      background-color: var(--bg-surface);
      padding: 2.25rem 1.5rem;
      margin-top: auto;
    }

    .footer-inner {
      max-width: var(--content-max-width);
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1.25rem;
      font-size: 0.85rem;
      color: var(--text-subtle);
    }

    .footer-links {
      display: flex;
      gap: 1.25rem;
      list-style: none;
    }

    .footer-links a {
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .footer-links a:hover {
      color: var(--accent-primary);
    }
  </style>
</head>
<body data-theme="dark">
  <!-- Top Navigation Header -->
  <header class="site-header">
    <div class="header-inner">
      <a href="#" class="brand-group">
        <span class="brand-icon">🌤️</span>
        <span class="brand-title">ShadowClaw Weather</span>
      </a>

      <!-- Quick Jump Anchors -->
      <ul class="nav-links-center">
        <li><a href="#key-capabilities" class="nav-link">Capabilities</a></li>
        <li><a href="#quick-start" class="nav-link">Quick Start</a></li>
        <li><a href="#script-catalog" class="nav-link">Scripts</a></li>
        <li><a href="#shared-well-known-agent-skills-declarative-tools" class="nav-link">Agent Skills</a></li>
        <li><a href="#usage-examples" class="nav-link">Examples</a></li>
      </ul>

      <div class="header-actions">
        <a href=".well-known/agent-skills/index.json" class="nav-btn" target="_blank" rel="noopener noreferrer" title="View published agent skills discovery index">
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Skills Index
        </a>
        <a href="https://github.com/xt-ml/shadow-claw-agent-cli-weather" class="nav-btn" target="_blank" rel="noopener noreferrer" title="View GitHub repository">
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          GitHub
        </a>
        <button id="theme-toggle" class="nav-btn theme-toggle-btn" type="button" aria-label="Toggle Light/Dark Theme">
          <span id="theme-icon">☀️</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content Layout -->
  <div class="main-wrapper">
    <article class="markdown-body">
      ${renderedHtml}
    </article>
  </div>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="footer-inner">
      <div>
        <span>ShadowClaw Agent CLI Weather &bull; Published on GitHub Pages</span>
      </div>
      <ul class="footer-links">
        <li><a href=".well-known/agent-skills/index.json" target="_blank" rel="noopener noreferrer">Discovery Index</a></li>
        <li><a href="https://github.com/xt-ml/shadow-claw" target="_blank" rel="noopener noreferrer">ShadowClaw Core</a></li>
        <li><a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo API</a></li>
        <li><a href="https://github.com/xt-ml/shadow-claw-agent-cli-weather" target="_blank" rel="noopener noreferrer">GitHub Repository</a></li>
      </ul>
    </div>
  </footer>

  <!-- Interactive Client-Side Scripts -->
  <script>
    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

    function setTheme(theme) {
      body.setAttribute('data-theme', theme);
      themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
      try {
        localStorage.setItem('sc_weather_theme', theme);
      } catch (_) {}
    }

    const savedTheme = (() => {
      try {
        return localStorage.getItem('sc_weather_theme');
      } catch (_) { return null; }
    })();

    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }

    themeToggleBtn.addEventListener('click', () => {
      const current = body.getAttribute('data-theme');
      setTheme(current === 'light' ? 'dark' : 'light');
    });

    // Copy Code Buttons
    document.querySelectorAll('.copy-code-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rawCode = decodeURIComponent(btn.getAttribute('data-code'));
        try {
          await navigator.clipboard.writeText(rawCode);
          btn.classList.add('copied');
          const textSpan = btn.querySelector('.copy-text');
          const origText = textSpan.textContent;
          textSpan.textContent = 'Copied!';
          setTimeout(() => {
            btn.classList.remove('copied');
            textSpan.textContent = origText;
          }, 2000);
        } catch (err) {
          console.error('Failed to copy to clipboard', err);
        }
      });
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(outputPath, fullHtml, "utf-8");

// Optionally format with Prettier if available
try {
  const { execSync } = await import("node:child_process");
  execSync("npx prettier --write index.html", {
    cwd: rootDir,
    stdio: "ignore",
  });
} catch (_) {}

console.log(
  `Successfully compiled README.md into ${outputPath} (${fs.statSync(outputPath).size} bytes)`,
);
