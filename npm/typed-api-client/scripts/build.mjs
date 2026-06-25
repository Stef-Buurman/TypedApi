#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tsc = path.join(root, "node_modules", "typescript", "bin", "tsc");
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });

run([
  "--project", "tsconfig.json",
  "--outDir", "dist/esm",
  "--module", "ESNext",
  "--moduleResolution", "Bundler",
  "--declaration", "false",
  "--declarationMap", "false",
]);

addJavaScriptExtensions(path.join(dist, "esm"));

run([
  "--project", "tsconfig.json",
  "--outDir", "dist/cjs",
  "--module", "CommonJS",
  "--moduleResolution", "Node",
  "--declaration", "false",
  "--declarationMap", "false",
]);

run([
  "--project", "tsconfig.json",
  "--outDir", "dist/types",
  "--emitDeclarationOnly",
  "--declaration", "true",
  "--declarationMap", "true",
]);

fs.writeFileSync(
  path.join(dist, "cjs", "package.json"),
  `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`,
);

function addJavaScriptExtensions(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      addJavaScriptExtensions(entryPath);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".js")) continue;

    const source = fs.readFileSync(entryPath, "utf8");
    const updated = source.replace(
      /(from\s+|import\s*\(\s*)(["'])(\.{1,2}\/[^"']+)(["'])/g,
      (match, prefix, quote, specifier, closingQuote) => {
        if (/\.(?:[cm]?js|json)$/.test(specifier)) return match;
        return `${prefix}${quote}${specifier}.js${closingQuote}`;
      },
    );
    fs.writeFileSync(entryPath, updated);
  }
}

function run(args) {
  const result = spawnSync(process.execPath, [tsc, ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
