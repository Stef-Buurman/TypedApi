import fs from 'node:fs';
import path from 'node:path';
import { generateContracts } from './schemas.mjs';
import { generateHttpClient } from './http-client.mjs';
import { collectOperations, generateControllerFile } from './operations.mjs';
import { resolveDefaultHandlers } from './default-handlers.mjs';
import { safeTypeName } from './names.mjs';

function cleanDirectory(directory) {
  if (fs.existsSync(directory)) fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory, { recursive: true });
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.replace(/\n{4,}/g, '\n\n\n'));
}

export function emitApi(document, config) {
  if (config.cleanOutput) cleanDirectory(config.apiRoot);
  else fs.mkdirSync(config.apiRoot, { recursive: true });

  const controllerDir = path.join(config.apiRoot, config.controllersFolder);
  fs.mkdirSync(controllerDir, { recursive: true });

  config.contractNames = Object.keys(document.components?.schemas ?? {}).map(safeTypeName);

  writeFile(path.join(config.apiRoot, config.contractsFileName), generateContracts(document, config));
  writeFile(path.join(config.apiRoot, config.httpClientFileName), generateHttpClient(config));

  const { controllers } = collectOperations(document, config);
  const defaultHandlers = resolveDefaultHandlers(config, controllerDir);
  const exports = [
    `export * from "./${config.contractsFileName.replace(/\.ts$/, '')}";`,
    `export * from "./${config.httpClientFileName.replace(/\.ts$/, '')}";`,
  ];

  for (const [controllerName, operations] of [...controllers.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const fileName = `${controllerName}.ts`;
    writeFile(path.join(controllerDir, fileName), generateControllerFile(controllerName, operations, config, defaultHandlers));
    exports.push(`export * from "./${config.controllersFolder}/${controllerName}";`);
  }

  if (config.generateBarrel) {
    writeFile(path.join(config.apiRoot, 'index.ts'), `${exports.join('\n')}\n`);
  }

  return { controllerCount: controllers.size, operationCount: [...controllers.values()].reduce((sum, items) => sum + items.length, 0) };
}
