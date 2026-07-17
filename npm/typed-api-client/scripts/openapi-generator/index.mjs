import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { collectOperations, validateOpenApiDocument } from "./openapi-utils.mjs";
import { generateDataContracts } from "./schema.mjs";
import { generateHttpClient } from "./http-client-template.mjs";
import {
  controllerNameForOperation,
  generateMethodFile,
  methodFileNameForController,
} from "./method-template.mjs";

const MANAGED_TOP_LEVEL = ["generated", "methods", "index.ts"];
const LEGACY_MANAGED_TOP_LEVEL = ["typedapi.manifest.json"];

export async function generateApi(options) {
  const inputPath = path.resolve(options.input);
  const output = path.resolve(options.output);
  const source = fs.readFileSync(inputPath, "utf8");
  const openApi = JSON.parse(source);

  validateOpenApiDocument(openApi, { supportedContractVersion: 1 });
  const operations = collectOperations(openApi, {
    generateMissingOperationIds: Boolean(options.generateMissingOperationIds),
    methodNameStyle: options.methodNameStyle ?? "operationId",
    prefixMethodNamesWithController:
      options.prefixMethodNamesWithController !== false,
  });

  const normalizedOptions = {
    moduleNameFirstTag: options.moduleNameFirstTag !== false,
    defaultResponseAsSuccess: Boolean(options.defaultResponseAsSuccess),
    generateUnionEnums: Boolean(options.generateUnionEnums),
    enumNamesAsValues: Boolean(options.enumNamesAsValues),
    useTypeOnlyImports: options.useTypeOnlyImports !== false,
    useFilterFormValues: options.useFilterFormValues !== false,
    baseUrl: options.baseUrl,
    runtimePackageName: options.runtimePackageName,
    defaultHandlers: options.defaultHandlers,
    methodNameStyle: options.methodNameStyle ?? "operationId",
    prefixMethodNamesWithController:
      options.prefixMethodNamesWithController !== false,
  };

  const files = new Map();
  files.set(
    "generated/data-contracts.ts",
    generateDataContracts(openApi, operations, normalizedOptions),
  );
  files.set(
    "generated/http-client.ts",
    generateHttpClient(openApi, normalizedOptions),
  );

  const controllers = new Map();
  for (const operationInfo of operations) {
    const controllerName = controllerNameForOperation(operationInfo, normalizedOptions);
    const controllerOperations = controllers.get(controllerName) ?? [];
    controllerOperations.push(operationInfo);
    controllers.set(controllerName, controllerOperations);
  }

  const controllerNames = [...controllers.keys()].sort((a, b) => a.localeCompare(b));
  for (const controllerName of controllerNames) {
    files.set(
      `methods/${methodFileNameForController(controllerName)}`,
      generateMethodFile(
        openApi,
        controllerName,
        controllers.get(controllerName),
        normalizedOptions,
      ),
    );
  }


  const changes = compareOutput(output, files);
  if (options.check) {
    if (changes.length > 0) {
      throw new Error(
        `Generated API is out of date:\n${changes.map((item) => `- ${item}`).join("\n")}`,
      );
    }
    return { files: [...files.keys()].map((file) => path.join(output, file)), changed: false };
  }

  const writeStrategy = writeOutputTransactionally(
    output,
    files,
    options.cleanOutput !== false,
    Boolean(options.forceInPlaceOutput),
  );
  return {
    files: [...files.keys()].map((file) => path.join(output, file)),
    changed: changes.length > 0,
    writeStrategy,
  };
}

function compareOutput(output, files) {
  const changes = [];
  for (const [relativePath, expected] of files) {
    const target = path.join(output, relativePath);
    if (!fs.existsSync(target)) {
      changes.push(`${relativePath} is missing`);
      continue;
    }
    if (fs.readFileSync(target, "utf8") !== expected) changes.push(`${relativePath} differs`);
  }

  for (const relativePath of listManagedFiles(output)) {
    if (!files.has(relativePath)) changes.push(`${relativePath} is stale`);
  }
  return changes;
}

function listManagedFiles(output) {
  const result = [];
  for (const topLevel of [...MANAGED_TOP_LEVEL, ...LEGACY_MANAGED_TOP_LEVEL]) {
    const target = path.join(output, topLevel);
    if (!fs.existsSync(target)) continue;
    if (fs.statSync(target).isFile()) {
      result.push(topLevel);
      continue;
    }
    walk(target, (file) => result.push(path.relative(output, file).replaceAll(path.sep, "/")));
  }
  return result;
}

function walk(directory, callback) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(entryPath, callback);
    else if (entry.isFile()) callback(entryPath);
  }
}

function removeManagedOutput(root) {
  for (const item of [...MANAGED_TOP_LEVEL, ...LEGACY_MANAGED_TOP_LEVEL]) {
    fs.rmSync(path.join(root, item), { recursive: true, force: true });
  }
}

const RETRYABLE_FS_ERROR_CODES = new Set([
  "EACCES",
  "EBUSY",
  "EMFILE",
  "ENFILE",
  "ENOTEMPTY",
  "EPERM",
]);

function writeOutputTransactionally(output, files, cleanOutput, forceInPlaceOutput = false) {
  const parent = path.dirname(output);
  fs.mkdirSync(parent, { recursive: true });
  const staging = fs.mkdtempSync(path.join(parent, `.${path.basename(output)}.typedapi-staging-`));
  const backup = path.join(parent, `.${path.basename(output)}.typedapi-backup-${process.pid}-${Date.now()}`);

  try {
    if (fs.existsSync(output)) fs.cpSync(output, staging, { recursive: true, force: true });
    if (cleanOutput) removeManagedOutput(staging);

    for (const [relativePath, content] of files) {
      const target = path.join(staging, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }

    if (forceInPlaceOutput) {
      writeManagedOutputInPlace(output, staging);
      return "managed-file-sync";
    }

    if (fs.existsSync(output)) {
      try {
        retryFileSystemOperation(() => fs.renameSync(output, backup));
      } catch (error) {
        if (!isRetryableFileSystemError(error)) throw error;
        writeManagedOutputInPlace(output, staging);
        return "managed-file-sync";
      }
    }

    try {
      retryFileSystemOperation(() => fs.renameSync(staging, output));
    } catch (error) {
      let restoreError;
      if (fs.existsSync(backup) && !fs.existsSync(output)) {
        try {
          retryFileSystemOperation(() => fs.renameSync(backup, output));
        } catch (caughtRestoreError) {
          restoreError = caughtRestoreError;
        }
      }

      if (restoreError) {
        throw new AggregateError(
          [error, restoreError],
          "TypedApi could not replace the generated output or restore the previous output.",
        );
      }

      if (isRetryableFileSystemError(error) && fs.existsSync(output)) {
        writeManagedOutputInPlace(output, staging);
        return "managed-file-sync";
      }
      throw error;
    }

    removePathWithRetry(backup);
    return "directory-swap";
  } finally {
    removePathWithRetry(staging);
    if (fs.existsSync(backup) && fs.existsSync(output)) removePathWithRetry(backup);
  }
}

function writeManagedOutputInPlace(output, staging) {
  const parent = path.dirname(output);
  fs.mkdirSync(output, { recursive: true });
  const managedBackup = fs.mkdtempSync(
    path.join(parent, `.${path.basename(output)}.typedapi-managed-backup-`),
  );
  const originallyPresent = new Set();

  try {
    for (const item of [...MANAGED_TOP_LEVEL, ...LEGACY_MANAGED_TOP_LEVEL]) {
      const current = path.join(output, item);
      if (!fs.existsSync(current)) continue;
      originallyPresent.add(item);
      syncPath(current, path.join(managedBackup, item));
    }

    for (const item of [...MANAGED_TOP_LEVEL, ...LEGACY_MANAGED_TOP_LEVEL]) {
      const source = path.join(staging, item);
      const target = path.join(output, item);
      if (fs.existsSync(source)) syncPath(source, target);
      else removePathWithRetry(target);
    }
  } catch (error) {
    try {
      for (const item of [...MANAGED_TOP_LEVEL, ...LEGACY_MANAGED_TOP_LEVEL]) {
        const target = path.join(output, item);
        const saved = path.join(managedBackup, item);
        if (originallyPresent.has(item)) syncPath(saved, target);
        else removePathWithRetry(target);
      }
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        "TypedApi generation failed and the previous managed output could not be fully restored.",
      );
    }
    throw error;
  } finally {
    removePathWithRetry(managedBackup);
  }
}

function syncPath(source, target) {
  const sourceStat = fs.lstatSync(source);

  if (sourceStat.isDirectory()) {
    if (fs.existsSync(target) && !fs.lstatSync(target).isDirectory()) {
      removePathWithRetry(target);
    }
    fs.mkdirSync(target, { recursive: true });

    const sourceEntries = new Set(fs.readdirSync(source));
    for (const entry of sourceEntries) {
      syncPath(path.join(source, entry), path.join(target, entry));
    }
    for (const entry of fs.readdirSync(target)) {
      if (!sourceEntries.has(entry)) removePathWithRetry(path.join(target, entry));
    }
    return;
  }

  if (sourceStat.isSymbolicLink()) {
    const linkTarget = fs.readlinkSync(source);
    if (fs.existsSync(target)) removePathWithRetry(target);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    retryFileSystemOperation(() => fs.symlinkSync(linkTarget, target));
    return;
  }

  if (fs.existsSync(target) && fs.lstatSync(target).isDirectory()) {
    removePathWithRetry(target);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const content = fs.readFileSync(source);
  retryFileSystemOperation(() => fs.writeFileSync(target, content));
}

function removePathWithRetry(target) {
  if (!target || !fs.existsSync(target)) return;
  retryFileSystemOperation(() =>
    fs.rmSync(target, {
      recursive: true,
      force: true,
      maxRetries: 4,
      retryDelay: 50,
    }),
  );
}

function retryFileSystemOperation(operation, attempts = 12) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableFileSystemError(error) || attempt === attempts - 1) throw error;
      sleepSynchronously(Math.min(25 * 2 ** attempt, 250));
    }
  }
  throw lastError;
}

function isRetryableFileSystemError(error) {
  return Boolean(error && typeof error === "object" && RETRYABLE_FS_ERROR_CODES.has(error.code));
}

function sleepSynchronously(milliseconds) {
  const sleeper = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(sleeper, 0, 0, milliseconds);
}
