import path from 'node:path';
import { cwd, readGeneratorConfig } from './config.mjs';
import { normalizeDocument, readOpenApiDocument } from './openapi.mjs';
import { emitApi } from './emit.mjs';

export async function generateTypedApi() {
  const config = readGeneratorConfig();
  const { document, label } = await readOpenApiDocument(config);
  const normalized = normalizeDocument(document);

  console.log(`Generating API from: ${label}`);
  console.log(`Output folder: ${path.relative(cwd, config.apiRoot) || '.'}`);

  const result = emitApi(normalized, config);

  console.log(`API generation completed. Generated ${result.operationCount} operations in ${result.controllerCount} controller files.`);
}
