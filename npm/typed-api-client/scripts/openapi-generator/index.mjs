import fs from "node:fs";
import path from "node:path";
import { collectOperations } from "./openapi-utils.mjs";
import { generateDataContracts } from "./schema.mjs";
import { generateHttpClient } from "./http-client-template.mjs";
import {
  controllerNameForOperation,
  generateMethodFile,
  methodFileNameForController,
} from "./method-template.mjs";

export async function generateApi(options) {
  const inputPath = path.resolve(options.input);
  const output = path.resolve(options.output);
  const openApi = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  if (!openApi.paths || typeof openApi.paths !== "object") {
    throw new Error(
      "The OpenAPI document does not contain a valid paths object.",
    );
  }

  const generatedDir = path.join(output, "generated");
  const methodsDir = path.join(output, "methods");

  if (options.cleanOutput !== false) {
    cleanApiOutput(output);
  }

  fs.mkdirSync(generatedDir, { recursive: true });
  fs.mkdirSync(methodsDir, { recursive: true });

  const operations = collectOperations(openApi).filter(
    (operationInfo) => operationInfo.operation?.operationId,
  );

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
  };

  fs.writeFileSync(
    path.join(generatedDir, "data-contracts.ts"),
    generateDataContracts(openApi, operations, normalizedOptions),
  );

  fs.writeFileSync(
    path.join(generatedDir, "http-client.ts"),
    generateHttpClient(openApi, normalizedOptions),
  );

  const controllers = new Map();
  for (const operationInfo of operations) {
    const controllerName = controllerNameForOperation(
      operationInfo,
      normalizedOptions,
    );
    const controllerOperations = controllers.get(controllerName) ?? [];
    controllerOperations.push(operationInfo);
    controllers.set(controllerName, controllerOperations);
  }

  const controllerNames = [...controllers.keys()].sort((a, b) =>
    a.localeCompare(b),
  );

  for (const controllerName of controllerNames) {
    fs.writeFileSync(
      path.join(methodsDir, methodFileNameForController(controllerName)),
      generateMethodFile(
        openApi,
        controllerName,
        controllers.get(controllerName),
        normalizedOptions,
      ),
    );
  }


  return {
    files: [
      path.join(generatedDir, "data-contracts.ts"),
      path.join(generatedDir, "http-client.ts"),
      ...controllerNames.map((controllerName) =>
        path.join(methodsDir, methodFileNameForController(controllerName)),
      ),
    ],
  };
}

function cleanApiOutput(output) {
  const removable = [
    path.join(output, "controllers"),
    path.join(output, "generated"),
    path.join(output, "methods"),
    path.join(output, "data-contracts.ts"),
    path.join(output, "http-client.ts"),
    path.join(output, "index.ts"),
  ];

  for (const item of removable) {
    if (fs.existsSync(item)) {
      fs.rmSync(item, { recursive: true, force: true });
    }
  }
}
