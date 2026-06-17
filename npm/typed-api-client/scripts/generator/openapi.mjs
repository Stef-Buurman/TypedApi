import fs from 'node:fs';
import path from 'node:path';
import { cwd } from './config.mjs';

function fileExists(filePath) {
  try { return fs.existsSync(filePath) && fs.statSync(filePath).isFile(); } catch { return false; }
}

function parseJson(text, label) {
  try { return JSON.parse(text); } catch (error) { throw new Error(`OpenAPI input must be JSON. Failed to parse ${label}: ${error.message}`); }
}

function writeBackup(config, text, sourceLabel) {
  parseJson(text, sourceLabel);
  fs.mkdirSync(path.dirname(config.backupPath), { recursive: true });
  fs.writeFileSync(config.backupPath, text);
  console.log(`Updated Swagger backup: ${path.relative(cwd, config.backupPath)}`);
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Swagger URL returned ${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function inputFromBackup(config, reason) {
  if (!fileExists(config.backupPath)) return undefined;
  console.warn(`${reason} Using backup: ${path.relative(cwd, config.backupPath)}`);
  return { document: parseJson(fs.readFileSync(config.backupPath, 'utf8'), config.backupPath), label: config.backupPath };
}

export async function readOpenApiDocument(config) {
  if (config.swaggerFile) {
    const filePath = path.resolve(cwd, config.swaggerFile);
    if (fileExists(filePath)) {
      const text = fs.readFileSync(filePath, 'utf8');
      writeBackup(config, text, filePath);
      return { document: parseJson(text, filePath), label: filePath };
    }
    const backup = await inputFromBackup(config, `Swagger file not found: ${filePath}.`);
    if (backup) return backup;
    throw new Error(`Swagger file was not found and no backup exists: ${filePath}`);
  }

  const url = config.swaggerUrl || config.defaultSwaggerUrl;
  try {
    const text = await fetchText(url);
    writeBackup(config, text, url);
    return { document: parseJson(text, url), label: url };
  } catch (error) {
    const defaultFile = path.resolve(cwd, 'swagger/swagger.json');
    if (!config.swaggerUrl && fileExists(defaultFile)) {
      const text = fs.readFileSync(defaultFile, 'utf8');
      writeBackup(config, text, defaultFile);
      return { document: parseJson(text, defaultFile), label: defaultFile };
    }
    const backup = await inputFromBackup(config, `Swagger URL unavailable: ${url}.`);
    if (backup) return backup;
    throw error;
  }
}

export function normalizeDocument(document) {
  if (!document || typeof document !== 'object') throw new Error('OpenAPI document must be an object.');
  if (!document.paths || typeof document.paths !== 'object') throw new Error('OpenAPI document does not contain a paths object.');
  return document;
}
