import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { generateApi } from "../scripts/openapi-generator/index.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function linkRuntimePackage(root) {
  const target = path.join(
    root,
    "node_modules",
    "typedapi-client-helpers",
  );

  fs.symlinkSync(
    packageRoot,
    target,
    process.platform === "win32" ? "junction" : "dir",
  );
}

function fixture() {
  return {
    openapi: "3.0.3",
    info: { title: "Generator regression fixture", version: "1.0.0" },
    "x-typedapi": { contractVersion: 1, producer: "TypedApi.Swagger", producerVersion: "0.3.0" },
    paths: {
      "/items/{Id}/search": {
        post: {
          tags: ["Items"],
          operationId: "items-search.v2",
          parameters: [
            { name: "Id", in: "path", required: true, schema: { type: "integer", format: "int64" } },
            { name: "Preview", in: "query", schema: { type: "boolean" } },
            { name: "X-Tenant", in: "header", required: true, schema: { type: "string" } },
            { name: "SessionId", in: "cookie", schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["PayloadName", "URLValue"],
                  properties: {
                    PayloadName: { type: "string" },
                    URLValue: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "OK",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Derived" } } },
            },
            400: {
              description: "Bad request",
              content: { "application/problem+json": { schema: { $ref: "#/components/schemas/ProblemDetails" } } },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Base: {
          type: "object",
          required: ["WireName", "URLValue"],
          properties: {
            WireName: { type: "string" },
            URLValue: { type: "string" },
          },
        },
        Derived: {
          allOf: [{ $ref: "#/components/schemas/Base" }],
          type: "object",
          required: ["OwnValue"],
          properties: { OwnValue: { type: "number" } },
        },
        ProblemDetails: {
          type: "object",
          properties: { Title: { type: "string", nullable: true } },
        },
      },
    },
  };
}

function createConsumer() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "typedapi-generator-test-"));
  fs.mkdirSync(path.join(root, "node_modules"), { recursive: true });
  linkRuntimePackage(root);
  fs.writeFileSync(path.join(root, "openapi.json"), JSON.stringify(fixture(), null, 2));
  fs.writeFileSync(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2020",
        lib: ["ES2020", "DOM"],
        module: "ESNext",
        moduleResolution: "Bundler",
        strict: true,
        skipLibCheck: true,
        noEmit: true,
      },
      include: ["src/**/*.ts"],
    }, null, 2),
  );
  return root;
}

test("generator lowercases only the first character and preserves wire names", async (t) => {
  const root = createConsumer();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const output = path.join(root, "src", "api");

  await generateApi({
    input: path.join(root, "openapi.json"),
    output,
    runtimePackageName: "typedapi-client-helpers",
    generatorVersion: "0.3.0",
  });

  const contracts = fs.readFileSync(path.join(output, "generated", "data-contracts.ts"), "utf8");
  const methods = fs.readFileSync(path.join(output, "methods", "Items.api.ts"), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(output, "typedapi.manifest.json"), "utf8"));

  assert.match(contracts, /wireName: string;/);
  assert.match(contracts, /uRLValue: string;/);
  assert.doesNotMatch(contracts, /WireName: string;/);
  assert.match(contracts, /ownValue: number;/);
  assert.match(contracts, /export type Derived = Base & \{/);
  assert.match(contracts, /payloadName: string;/);
  assert.match(contracts, /export interface ItemsSearchV2Params/);
  assert.doesNotMatch(contracts, /ItemsSearchV2(?:Path|Query|Header|Cookie)Params/);
  assert.doesNotMatch(contracts, /export interface ItemsSearchV2Request/);
  assert.match(contracts, /id: number;/);
  assert.match(contracts, /preview\?: boolean;/);
  assert.match(contracts, /"x-Tenant": string;/);
  assert.match(contracts, /sessionId\?: string;/);
  assert.match(methods, /export async function itemsSearchV2\(\s*pathParams: ItemsSearchV2Params,\s*data: ItemsSearchV2Payload,/);
  assert.match(methods, /pathParams\["id"\]/);
  assert.match(methods, /"Preview": pathParams\["preview"\]/);
  assert.match(methods, /toWireValue\(data,/);
  assert.match(methods, /"X-Tenant": pathParams\["x-Tenant"\]/);
  assert.match(methods, /"SessionId": pathParams\["sessionId"\]/);
  assert.match(methods, /transformResponse: .*fromWireValue/);
  assert.match(methods, /ApiResult<Derived, ProblemDetails>/);
  assert.equal(manifest.contractVersion, 1);
  assert.equal(manifest.operationCount, 1);

  const compile = spawnSync(
    process.execPath,
    [path.join(packageRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json"],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(compile.status, 0, `${compile.stdout}\n${compile.stderr}`);

  await generateApi({
    input: path.join(root, "openapi.json"),
    output,
    runtimePackageName: "typedapi-client-helpers",
    generatorVersion: "0.3.0",
    check: true,
  });

  fs.appendFileSync(path.join(output, "index.ts"), "// stale\n");
  await assert.rejects(
    generateApi({
      input: path.join(root, "openapi.json"),
      output,
      runtimePackageName: "typedapi-client-helpers",
      generatorVersion: "0.3.0",
      check: true,
    }),
    /index\.ts differs/,
  );
});

test("generator reports normalized operation ID collisions", async (t) => {
  const root = createConsumer();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const document = fixture();
  document.paths["/other"] = {
    get: {
      operationId: "items search v2",
      responses: { 204: { description: "No content" } },
    },
  };
  fs.writeFileSync(path.join(root, "openapi.json"), JSON.stringify(document));

  await assert.rejects(
    generateApi({ input: path.join(root, "openapi.json"), output: path.join(root, "src", "api") }),
    /both normalize to TypeScript/,
  );
});


test("generator falls back to Windows-safe managed-file synchronization", async (t) => {
  const root = createConsumer();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const output = path.join(root, "src", "api");

  await generateApi({
    input: path.join(root, "openapi.json"),
    output,
    runtimePackageName: "typedapi-client-helpers",
    generatorVersion: "0.3.0",
  });

  fs.writeFileSync(path.join(output, "custom.ts"), "export const custom = true;\n");
  fs.writeFileSync(path.join(output, "methods", "Stale.api.ts"), "export const stale = true;\n");
  fs.appendFileSync(path.join(output, "index.ts"), "// old generated content\n");

  const result = await generateApi({
    input: path.join(root, "openapi.json"),
    output,
    runtimePackageName: "typedapi-client-helpers",
    generatorVersion: "0.3.0",
    forceInPlaceOutput: true,
  });

  assert.equal(result.writeStrategy, "managed-file-sync");
  assert.equal(
    fs.readFileSync(path.join(output, "custom.ts"), "utf8"),
    "export const custom = true;\n",
  );
  assert.equal(fs.existsSync(path.join(output, "methods", "Stale.api.ts")), false);
  assert.doesNotMatch(fs.readFileSync(path.join(output, "index.ts"), "utf8"), /old generated content/);

  await generateApi({
    input: path.join(root, "openapi.json"),
    output,
    runtimePackageName: "typedapi-client-helpers",
    generatorVersion: "0.3.0",
    check: true,
  });
});

test("body-only operations accept the payload directly without a request wrapper", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "typedapi-body-only-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const output = path.join(root, "src", "api");
  const document = JSON.parse(fs.readFileSync(path.join(packageRoot, "swagger", "swagger.json"), "utf8"));
  fs.writeFileSync(path.join(root, "openapi.json"), JSON.stringify(document));
  fs.writeFileSync(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2020",
        lib: ["ES2020", "DOM"],
        module: "ESNext",
        moduleResolution: "Bundler",
        strict: true,
        skipLibCheck: true,
        noEmit: true,
      },
      include: ["src/**/*.ts"],
    }, null, 2),
  );
  fs.mkdirSync(path.join(root, "node_modules"), { recursive: true });
  linkRuntimePackage(root);

  await generateApi({
    input: path.join(root, "openapi.json"),
    output,
    runtimePackageName: "typedapi-client-helpers",
    generatorVersion: "0.3.0",
  });

  const contracts = fs.readFileSync(path.join(output, "generated", "data-contracts.ts"), "utf8");
  const methods = fs.readFileSync(path.join(output, "methods", "Import.api.ts"), "utf8");
  const orderMethods = fs.readFileSync(path.join(output, "methods", "Order.api.ts"), "utf8");
  const supplierMethods = fs.readFileSync(path.join(output, "methods", "Supplier.api.ts"), "utf8");

  assert.match(contracts, /export interface UploadProductFilesPayload \{/);
  assert.match(contracts, /files\?: File\[\];/);
  assert.doesNotMatch(contracts, /Files\?: File\[\];/);
  assert.doesNotMatch(contracts, /export interface UploadProductFilesRequest/);
  assert.match(methods, /export async function uploadProductFiles\(\s*data: UploadProductFilesPayload,/);
  assert.match(methods, /body: toWireValue\(data, typedApiWireSchemas\["operation:UploadProductFiles:body"\]/);
  assert.doesNotMatch(methods, /body: input\.body/);

  assert.doesNotMatch(contracts, /export interface GetOrderByIdPathParams/);
  assert.match(contracts, /export interface GetOrderByIdParams \{\s*\/\*\* @format uuid \*\/\s*id: string;/);
  assert.match(orderMethods, /export async function getOrderById\(\s*pathParams: GetOrderByIdParams,/);
  assert.match(orderMethods, /path: `\/api\/orders\/\$\{encodeURIComponent\(String\(pathParams\["id"\]\)\)\}`/);
  assert.match(contracts, /export interface CancelOrderParams/);
  assert.doesNotMatch(contracts, /CancelOrder(?:Path|Query)Params|CancelOrderRequest/);

  assert.match(contracts, /export interface DeleteSupplierParams \{\s*\/\*\* @format uuid \*\/\s*id: string;/);
  assert.match(supplierMethods, /export async function deleteSupplier\(\s*pathParams: DeleteSupplierParams,/);
  assert.match(supplierMethods, /path: `\/api\/suppliers\/\$\{encodeURIComponent\(String\(pathParams\["id"\]\)\)\}`/);
  assert.match(contracts, /export interface UpdateSupplierParams \{[\s\S]*?id: string;[\s\S]*?\}/);
  assert.doesNotMatch(contracts, /export interface UpdateSupplierRequest/);
  assert.match(supplierMethods, /export async function updateSupplier\(\s*pathParams: UpdateSupplierParams,\s*data: SupplierRequest,/);
  assert.match(supplierMethods, /body: toWireValue\(data,/);

  const compile = spawnSync(
    process.execPath,
    [path.join(packageRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json"],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(compile.status, 0, `${compile.stdout}\n${compile.stderr}`);
});

test("generator rejects first-character naming collisions", async (t) => {
  const root = createConsumer();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const document = fixture();
  document.components.schemas.Collision = {
    type: "object",
    properties: {
      Files: { type: "string" },
      files: { type: "string" },
    },
  };
  fs.writeFileSync(path.join(root, "openapi.json"), JSON.stringify(document));

  await assert.rejects(
    generateApi({ input: path.join(root, "openapi.json"), output: path.join(root, "src", "api") }),
    /both become TypeScript property "files"/,
  );
});

test("non-body parameters use grouped params arguments for every parameter location", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "typedapi-single-param-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "node_modules"), { recursive: true });
  linkRuntimePackage(root);

  const document = {
    openapi: "3.0.3",
    info: { title: "Single parameter fixture", version: "1.0.0" },
    paths: {
      "/orders/{Id}": {
        get: {
          tags: ["Single"],
          operationId: "GetOrderById",
          parameters: [{ name: "Id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { 204: { description: "No content" } },
        },
      },
      "/search": {
        get: {
          tags: ["Single"],
          operationId: "SearchByTerm",
          parameters: [{ name: "Term", in: "query", schema: { type: "string" } }],
          responses: { 204: { description: "No content" } },
        },
      },
      "/header": {
        get: {
          tags: ["Single"],
          operationId: "GetWithHeader",
          parameters: [{ name: "X-Key", in: "header", required: true, schema: { type: "string" } }],
          responses: { 204: { description: "No content" } },
        },
      },
      "/cookie": {
        get: {
          tags: ["Single"],
          operationId: "GetWithCookie",
          parameters: [{ name: "Session", in: "cookie", schema: { type: "string" } }],
          responses: { 204: { description: "No content" } },
        },
      },
    },
  };

  fs.writeFileSync(path.join(root, "openapi.json"), JSON.stringify(document));
  fs.writeFileSync(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2020",
        lib: ["ES2020", "DOM"],
        module: "ESNext",
        moduleResolution: "Bundler",
        strict: true,
        skipLibCheck: true,
        noEmit: true,
      },
      include: ["src/**/*.ts"],
    }),
  );

  const output = path.join(root, "src", "api");
  await generateApi({
    input: path.join(root, "openapi.json"),
    output,
    runtimePackageName: "typedapi-client-helpers",
    generatorVersion: "0.3.0",
  });

  const contracts = fs.readFileSync(path.join(output, "generated", "data-contracts.ts"), "utf8");
  const methods = fs.readFileSync(path.join(output, "methods", "Single.api.ts"), "utf8");

  assert.doesNotMatch(contracts, /GetOrderByIdPathParams|SearchByTermQueryParams|GetWithHeaderHeaderParams|GetWithCookieCookieParams/);
  assert.doesNotMatch(contracts, /GetOrderByIdRequest|SearchByTermRequest|GetWithHeaderRequest|GetWithCookieRequest/);
  assert.match(contracts, /export interface GetOrderByIdParams \{[\s\S]*?id: string;[\s\S]*?\}/);
  assert.match(contracts, /export interface SearchByTermParams \{[\s\S]*?term\?: string;[\s\S]*?\}/);
  assert.match(contracts, /export interface GetWithHeaderParams \{[\s\S]*?"x-Key": string;[\s\S]*?\}/);
  assert.match(contracts, /export interface GetWithCookieParams \{[\s\S]*?session\?: string;[\s\S]*?\}/);
  assert.match(methods, /getOrderById\(\s*pathParams: GetOrderByIdParams,/);
  assert.match(methods, /path: `\/orders\/\$\{encodeURIComponent\(String\(pathParams\["id"\]\)\)\}`/);
  assert.match(methods, /searchByTerm\(\s*query: SearchByTermParams = \{\},/);
  assert.match(methods, /query: \{ "Term": query\["term"\] \}/);
  assert.match(methods, /getWithHeader\(\s*requestParams: GetWithHeaderParams,/);
  assert.match(methods, /toRequestHeaders\(\{ "X-Key": requestParams\["x-Key"\] \}\)/);
  assert.match(methods, /getWithCookie\(\s*requestParams: GetWithCookieParams = \{\},/);
  assert.match(methods, /requestParams\["session"\] !== undefined \? \{ Cookie: toCookieHeader\(\{ "Session": requestParams\["session"\] \}\) \}/);

  const compile = spawnSync(
    process.execPath,
    [path.join(packageRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json"],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(compile.status, 0, `${compile.stdout}\n${compile.stderr}`);
});

test("action method names can omit the controller prefix", async (t) => {
  const root = createConsumer();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const document = fixture();
  document.paths["/items/{Id}/search"].post["x-typedapi-operation"] = {
    controllerName: "Items",
    actionName: "SearchItems",
  };
  fs.writeFileSync(path.join(root, "openapi.json"), JSON.stringify(document));

  const output = path.join(root, "src", "api");
  await generateApi({
    input: path.join(root, "openapi.json"),
    output,
    runtimePackageName: "typedapi-client-helpers",
    generatorVersion: "0.3.0",
    methodNameStyle: "action",
    prefixMethodNamesWithController: false,
  });

  const contracts = fs.readFileSync(path.join(output, "generated", "data-contracts.ts"), "utf8");
  const methods = fs.readFileSync(path.join(output, "methods", "Items.api.ts"), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(output, "typedapi.manifest.json"), "utf8"));

  assert.match(methods, /export async function searchItems\(/);
  assert.doesNotMatch(methods, /export async function itemsSearchV2\(/);
  assert.match(contracts, /export interface SearchItemsParams/);
  assert.match(contracts, /export interface SearchItemsPayload/);
  assert.doesNotMatch(contracts, /export interface ItemsSearchV2(?:Params|Payload)/);
  assert.match(methods, /\* @name SearchItems/);
  assert.match(methods, /pathParams: SearchItemsParams,\s*data: SearchItemsPayload,/);
  assert.equal(manifest.methodNameStyle, "action");
  assert.equal(manifest.prefixMethodNamesWithController, false);
});

test("action method names can include the controller prefix", async (t) => {
  const root = createConsumer();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const document = fixture();
  document.paths["/items/{Id}/search"].post["x-typedapi-operation"] = {
    controllerName: "ItemsController",
    actionName: "SearchItems",
  };
  fs.writeFileSync(path.join(root, "openapi.json"), JSON.stringify(document));

  const output = path.join(root, "src", "api");
  await generateApi({
    input: path.join(root, "openapi.json"),
    output,
    runtimePackageName: "typedapi-client-helpers",
    generatorVersion: "0.3.0",
    methodNameStyle: "action",
    prefixMethodNamesWithController: true,
  });

  const contracts = fs.readFileSync(path.join(output, "generated", "data-contracts.ts"), "utf8");
  const methods = fs.readFileSync(path.join(output, "methods", "Items.api.ts"), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(output, "typedapi.manifest.json"), "utf8"));

  assert.match(methods, /export async function itemsSearchItems\(/);
  assert.match(contracts, /export interface ItemsSearchItemsParams/);
  assert.match(contracts, /export interface ItemsSearchItemsPayload/);
  assert.match(methods, /\* @name ItemsSearchItems/);
  assert.match(methods, /pathParams: ItemsSearchItemsParams,\s*data: ItemsSearchItemsPayload,/);
  assert.equal(manifest.methodNameStyle, "action");
  assert.equal(manifest.prefixMethodNamesWithController, true);
});

test("controller prefix is not duplicated when the action already starts with it", async (t) => {
  const root = createConsumer();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const document = fixture();
  document.paths["/items/{Id}/search"].post["x-typedapi-operation"] = {
    controllerName: "ItemsController",
    actionName: "ItemsSearch",
  };
  fs.writeFileSync(path.join(root, "openapi.json"), JSON.stringify(document));

  const output = path.join(root, "src", "api");
  await generateApi({
    input: path.join(root, "openapi.json"),
    output,
    methodNameStyle: "action",
    prefixMethodNamesWithController: true,
  });

  const methods = fs.readFileSync(path.join(output, "methods", "Items.api.ts"), "utf8");
  assert.match(methods, /export async function itemsSearch\(/);
  assert.doesNotMatch(methods, /itemsItemsSearch/);
});

test("action naming shortens paginated query types and sends builtQuery directly", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "typedapi-action-query-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "node_modules"), { recursive: true });
  linkRuntimePackage(root);

  const document = {
    openapi: "3.0.3",
    info: { title: "Action query fixture", version: "1.0.0" },
    paths: {
      "/api/suppliers": {
        get: {
          tags: ["Supplier"],
          operationId: "Supplier_GetSuppliers_GET_api_suppliers",
          "x-typedapi-operation": {
            controllerName: "Supplier",
            actionName: "GetSuppliers",
          },
          "x-typedapi-pagination": {
            pageProperty: "PageNumber",
            pageSizeProperty: "PageSize",
          },
          parameters: [
            { name: "ProductIds", in: "query", schema: { type: "array", items: { type: "string", format: "uuid" } } },
            { name: "Search", in: "query", schema: { type: "string" } },
            { name: "PageNumber", in: "query", schema: { type: "integer" } },
            { name: "PageSize", in: "query", schema: { type: "integer" } },
            { name: "SortBy", in: "query", schema: { type: "string" } },
            { name: "SortDirection", in: "query", schema: { type: "string" } },
          ],
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SupplierModelApiPaginationResponse" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        SupplierModel: {
          type: "object",
          properties: { Id: { type: "string", format: "uuid" } },
        },
        SupplierModelApiPaginationResponse: {
          type: "object",
          properties: {
            Data: { type: "array", items: { $ref: "#/components/schemas/SupplierModel" } },
            TotalCount: { type: "integer" },
          },
        },
      },
    },
  };

  fs.writeFileSync(path.join(root, "openapi.json"), JSON.stringify(document));
  fs.writeFileSync(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2020",
        lib: ["ES2020", "DOM"],
        module: "ESNext",
        moduleResolution: "Bundler",
        strict: true,
        skipLibCheck: true,
        noEmit: true,
      },
      include: ["src/**/*.ts"],
    }),
  );

  const output = path.join(root, "src", "api");
  await generateApi({
    input: path.join(root, "openapi.json"),
    output,
    runtimePackageName: "typedapi-client-helpers",
    generatorVersion: "0.3.0",
    methodNameStyle: "action",
    prefixMethodNamesWithController: false,
  });

  const contracts = fs.readFileSync(path.join(output, "generated", "data-contracts.ts"), "utf8");
  const methods = fs.readFileSync(path.join(output, "methods", "Supplier.api.ts"), "utf8");

  assert.match(contracts, /export interface GetSuppliersQueryParams/);
  assert.doesNotMatch(contracts, /SupplierGetSuppliersGETApiSuppliersQueryParams/);
  assert.match(methods, /@name GetSuppliers/);
  assert.match(methods, /FilterFormValues<GetSuppliersQueryParams>/);
  assert.match(methods, /query: builtQuery,/);
  assert.doesNotMatch(methods, /"ProductIds": builtQuery\["productIds"\]/);
  assert.doesNotMatch(methods, /SupplierGetSuppliersGETApiSuppliersQueryParams/);

  const compile = spawnSync(
    process.execPath,
    [path.join(packageRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json"],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(compile.status, 0, `${compile.stdout}\n${compile.stderr}`);
});

test("action method name style requires TypedApi action metadata", async (t) => {
  const root = createConsumer();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  await assert.rejects(
    generateApi({
      input: path.join(root, "openapi.json"),
      output: path.join(root, "src", "api"),
      methodNameStyle: "action",
    }),
    /x-typedapi-operation\.actionName metadata/,
  );
});

test("action method name style reports duplicate controller action names", async (t) => {
  const root = createConsumer();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const document = fixture();
  document.paths["/items/{Id}/search"].post["x-typedapi-operation"] = {
    controllerName: "Items",
    actionName: "Get",
  };
  document.paths["/orders"] = {
    get: {
      tags: ["Orders"],
      operationId: "Orders_Get_GET_api_Orders",
      "x-typedapi-operation": { controllerName: "Orders", actionName: "Get" },
      responses: { 204: { description: "No content" } },
    },
  };
  fs.writeFileSync(path.join(root, "openapi.json"), JSON.stringify(document));

  await assert.rejects(
    generateApi({
      input: path.join(root, "openapi.json"),
      output: path.join(root, "src", "api"),
      methodNameStyle: "action",
      prefixMethodNamesWithController: false,
    }),
    /Generated TypeScript method name "get_" is duplicated/,
  );
});
