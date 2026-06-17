import fs from 'node:fs';
import path from 'node:path';
import { cwd } from './config.mjs';

function resolveImportFilePath(fromDirectory, importPath) {
  if (!importPath.startsWith('.')) return undefined;
  const base = path.resolve(fromDirectory, importPath);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, path.join(base, 'index.ts'), path.join(base, 'index.js')];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function toRelativeImportPath(fromDirectory, filePath) {
  let relativePath = path.relative(fromDirectory, filePath).replaceAll(path.sep, '/');
  if (!relativePath.startsWith('.')) relativePath = `./${relativePath}`;
  return relativePath.replace(/\.(ts|tsx|js|jsx)$/, '');
}

function fileExportsName(source, exportName) {
  const escaped = exportName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`export\\s+(?:async\\s+)?(?:function|const|let|var|class)\\s+${escaped}\\b`, 'm').test(source)) return true;
  for (const match of source.matchAll(/export\s*\{([\s\S]*?)\}/g)) {
    const parts = match[1].split(',').map((x) => x.trim()).filter(Boolean);
    if (parts.some((part) => {
      const [local, alias] = part.split(/\s+as\s+/).map((x) => x.trim());
      return alias === exportName || (!alias && local === exportName);
    })) return true;
  }
  return false;
}

function createDefaultFunctionsFile(config, filePath) {
  const resolved = path.extname(filePath) ? filePath : `${filePath}.ts`;
  if (fs.existsSync(resolved)) return resolved;
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const runtimeImport = config.runtimePackageName === "../.." ? "./index" : config.runtimePackageName;
  fs.writeFileSync(resolved, `import type { ApiErrorResult, ApiSuccessResult } from "${runtimeImport}";\n\nexport function ${config.defaultSuccessHandler}<T>(_response: ApiSuccessResult<T>): void | Promise<void> {\n  // Add your default success handling here.\n}\n\nexport function ${config.defaultErrorHandler}<T>(_error: ApiErrorResult<T>): void | Promise<void> {\n  // Add your default error handling here.\n}\n`);
  console.log(`Created default API handler file: ${path.relative(cwd, resolved)}`);
  return resolved;
}

export function resolveDefaultHandlers(config, fromDirectory) {
  const setting = config.defaultFunctionsPath;
  const absoluteSetting = path.resolve(cwd, setting);
  const filePath = resolveImportFilePath(fromDirectory, setting) ?? createDefaultFunctionsFile(config, absoluteSetting);
  const source = fs.readFileSync(filePath, 'utf8');
  const hasSuccess = fileExportsName(source, config.defaultSuccessHandler);
  const hasError = fileExportsName(source, config.defaultErrorHandler);
  if (!hasSuccess || !hasError) {
    const missing = [!hasSuccess ? config.defaultSuccessHandler : undefined, !hasError ? config.defaultErrorHandler : undefined].filter(Boolean);
    console.warn(`Default API handlers not imported because ${path.relative(cwd, filePath)} does not export: ${missing.join(', ')}.`);
    return undefined;
  }
  return {
    path: toRelativeImportPath(fromDirectory, filePath),
    success: config.defaultSuccessHandler,
    error: config.defaultErrorHandler,
  };
}
