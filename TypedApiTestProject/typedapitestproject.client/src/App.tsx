import { useMemo, useState } from "react";
import "./App.css";
import type { ApiResult, FilterFormValues } from "typedapi-client-helpers";
import {
  OrderStatus,
  type EmailNotificationModel,
  type FilterFormGetMapItemsQueryParams,
  type FilterFormGetPagedQueryParams,
  type FilterFormGetWithMethodAttributeQueryParams,
  type FilterFormGetWithParameterAttributeQueryParams,
  type NullabilityContract,
  type ProjectModel,
} from "./api/generated/data-contracts";
import {
  importUploadMixedImport,
  importUploadProductFiles,
  importUploadSupplierFile,
} from "./api/methods/Import.api";
import {
  orderApproveOrder,
  orderCancelOrder,
  orderCreateOrder,
  orderDeleteOrder,
  orderGetOrderById,
  orderGetOrders,
  orderUpdateOrder,
} from "./api/methods/Order.api";
import {
  productCreateProduct,
  productDeleteProduct,
  productExportProducts,
  productGetProductById,
  productGetProducts,
  productGetProductSortState,
  productToggleProductActive,
  productUpdateProduct,
} from "./api/methods/Product.api";
import {
  supplierCreateSupplier,
  supplierDeleteSupplier,
  supplierGetSupplierById,
  supplierGetSuppliers,
  supplierUpdateSupplier,
  supplierVerifySupplier,
} from "./api/methods/Supplier.api";
import {
  warehouseCreateWarehouse,
  warehouseDeleteWarehouse,
  warehouseGetWarehouseById,
  warehouseGetWarehouses,
  warehouseUpdateWarehouse,
} from "./api/methods/Warehouse.api";
import {
  endpointCoverageDeleteNoContent,
  endpointCoverageDownloadFile,
  endpointCoverageGetArray,
  endpointCoverageGetDelayed,
  endpointCoverageGetDictionary,
  endpointCoverageGetMalformedJson,
  endpointCoverageGetObject,
  endpointCoverageGetPathAndQuery,
  endpointCoverageGetPrimitive,
  endpointCoverageGetText,
  endpointCoveragePatchJson,
  endpointCoveragePostAccepted,
  endpointCoveragePostJson,
  endpointCoveragePostPrimitiveBody,
  endpointCoveragePostUrlEncoded,
} from "./api/methods/EndpointCoverage.api";
import {
  inheritanceEchoProject,
  inheritanceGetProject,
  inheritanceGetTeamMember,
} from "./api/methods/Inheritance.api";
import {
  filterFormGetHeaderAndQuery,
  filterFormGetMapItems,
  filterFormGetMixedPathAndQuery,
  filterFormGetPaged,
  filterFormGetUnmarked,
  filterFormGetWithMethodAttribute,
  filterFormGetWithParameterAttribute,
} from "./api/methods/FilterForm.api";
import {
  typedApiFeaturesEchoNotification,
  typedApiFeaturesEchoNullability,
  typedApiFeaturesGetNotification,
  typedApiFeaturesGetNullability,
  typedApiFeaturesGetProjectWithTypedErrors,
  typedApiFeaturesGetProjects,
  typedApiFeaturesGetTeamMemberEnvelope,
} from "./api/methods/TypedApiFeatures.api";

type TestStatus = "idle" | "running" | "passed" | "failed";

type TestResult = {
  id: string;
  group: string;
  name: string;
  method: string;
  path: string;
  status: TestStatus;
  statusCode?: number;
  duration?: number;
  response?: unknown;
  error?: string;
};

type TestContext = {
  productId?: string;
  supplierId?: string;
  warehouseId?: string;
  orderId?: string;
  coverageId?: string;
};

type GeneratedResult = ApiResult<unknown>;

type TestDefinition = Omit<TestResult, "status"> & {
  run: (context: TestContext) => Promise<GeneratedResult>;
  capture?: (data: unknown, context: TestContext) => void;
  validate?: (data: unknown, context: TestContext) => void;
  expectedStatuses?: number[];
  expectedFailure?: boolean;
};

const productBody = (supplierId: string) => ({
  name: "Frontend test product",
  sku: `TEST-${Date.now()}`,
  price: 19.95,
  stock: 25,
  active: true,
  supplierId,
});

const supplierBody = {
  companyName: "Frontend Test Supplier",
  contactEmail: "frontend-test@example.com",
  countryCode: "NL",
  verified: false,
};

const warehouseBody = {
  code: `TST-${String(Date.now()).slice(-5)}`,
  name: "Frontend Test Warehouse",
  city: "Delft",
  countryCode: "NL",
  capacity: 500,
  isActive: true,
};

const orderBody = (productId: string, supplierId: string) => ({
  orderNumber: `FRONTEND-${Date.now()}`,
  productId,
  supplierId,
  quantity: 3,
  totalPrice: 59.85,
  orderedAt: new Date().toISOString(),
  status: OrderStatus.Draft,
});

const inheritanceProjectBody: ProjectModel = {
  id: "33333333-3333-3333-3333-333333333333",
  createdBy: "project-service",
  createdAt: "2026-07-01T08:30:00+00:00",
  updatedBy: "release-manager",
  updatedAt: "2026-07-20T14:15:00+00:00",
  isActive: true,
  revision: 7,
  code: "TYPED-API",
  name: "Typed API test project",
  ownerId: "11111111-1111-1111-1111-111111111111",
  owner: {
    id: "11111111-1111-1111-1111-111111111111",
    createdBy: "identity-service",
    createdAt: "2026-06-10T09:00:00+00:00",
    updatedBy: "admin-user",
    updatedAt: "2026-07-10T11:45:00+00:00",
    isActive: true,
    revision: 3,
    displayName: "Alex Morgan",
    email: "alex.morgan@example.com",
    department: "Engineering",
  },
  members: [
    {
      id: "22222222-2222-2222-2222-222222222222",
      createdBy: "identity-service",
      createdAt: "2026-06-12T13:30:00+00:00",
      isActive: true,
      revision: 1,
      displayName: "Jamie Lee",
      email: "jamie.lee@example.com",
      department: "Quality Assurance",
    },
  ],
  milestones: [
    {
      id: "44444444-4444-4444-4444-444444444444",
      createdBy: "project-service",
      createdAt: "2026-07-02T10:00:00+00:00",
      isActive: true,
      revision: 1,
      title: "Verify generated inheritance",
      dueAt: "2026-08-01T16:00:00+00:00",
      completed: false,
      notes: "Confirm inherited and nested properties are strongly typed.",
    },
  ],
  budget: 12500.5,
  plannedReleaseAt: "2026-08-15T09:00:00+00:00",
};

function testFiles(count = 1) {
  return Array.from(
    { length: count },
    (_, index) =>
      new File([`test file ${index + 1}`], `test-${index + 1}.txt`, {
        type: "text/plain",
      }),
  );
}

function extractId(data: unknown) {
  return typeof data === "object" && data !== null && "id" in data
    ? String((data as { id: unknown }).id)
    : undefined;
}

function requireId(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} was not created by an earlier test.`);
  return value;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return error == null ? "Request failed." : JSON.stringify(error);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function asRecord(value: unknown, label = "response") {
  assert(
    typeof value === "object" && value !== null,
    `${label} must be an object.`,
  );
  return value as Record<string, unknown>;
}

const filterItemId = "10000000-0000-0000-0000-000000000001";
const filterCreatedFrom = new Date("2026-01-01T00:00:00.000Z");
const filterCreatedTo = new Date("2026-12-31T23:59:59.000Z");

const methodAttributeFilters = [
  {
    name: "Search",
    filterName: "search",
    type: "string",
    value: "filtered-search",
    isAList: false,
  },
  {
    name: "Score range",
    filterName: "minScore",
    filterNameMax: "maxScore",
    type: "number",
    value: "10",
    maxValue: "50",
    isAList: false,
  },
  {
    name: "Active",
    filterName: "active",
    type: "boolean",
    value: "true",
    isAList: false,
  },
  {
    name: "Created range",
    filterName: "createdFrom",
    filterNameMax: "createdTo",
    type: "date",
    value: filterCreatedFrom,
    maxValue: filterCreatedTo,
    isAList: false,
  },
  {
    name: "Categories",
    filterName: "categories",
    type: "OptionValue",
    value: [
      { name: "City", value: "city" },
      { name: "Harbour", value: "harbour" },
    ],
    isAList: true,
  },
  {
    name: "Item IDs",
    filterName: "itemIds",
    type: "string",
    value: [filterItemId],
    isAList: true,
  },
] satisfies FilterFormValues<FilterFormGetWithMethodAttributeQueryParams>[];

const parameterAttributeFilters = [
  {
    name: "Search",
    filterName: "search",
    type: "string",
    value: "parameter-attribute",
    isAList: false,
  },
  {
    name: "Active",
    filterName: "active",
    type: "boolean-button",
    value: false,
    isAList: false,
  },
] satisfies FilterFormValues<FilterFormGetWithParameterAttributeQueryParams>[];

const mapFilters = [
  {
    name: "Search override",
    filterName: "search",
    type: "string",
    value: "filter-wins",
    isAList: false,
  },
  {
    name: "Minimum score",
    filterName: "minScore",
    type: "number",
    value: 25,
    isAList: false,
  },
] satisfies FilterFormValues<FilterFormGetMapItemsQueryParams>[];

const pagedFilters = [
  {
    name: "Minimum score",
    filterName: "minScore",
    type: "number",
    value: 5,
    isAList: false,
  },
  {
    name: "Active",
    filterName: "active",
    type: "boolean",
    value: true,
    isAList: false,
  },
  {
    name: "Categories",
    filterName: "categories",
    type: "OptionValue",
    value: [{ name: "City", value: "city" }],
    isAList: true,
  },
] satisfies FilterFormValues<FilterFormGetPagedQueryParams>[];

const nullabilityBody: NullabilityContract = {
  requiredText: "Frontend required text",
  requiredNullableText: null,
  jsonRequiredNullableText: null,
  validatedText: "Frontend validated text",
  optionalNullableText: null,
  requiredCount: 7,
  optionalCount: null,
};

const emailNotificationBody: EmailNotificationModel = {
  kind: "email",
  message: "Frontend discriminator request",
  createdAt: "2026-07-24T12:00:00.000Z",
  emailAddress: "frontend@example.com",
  subject: "TypedApi union test",
};

const tests: TestDefinition[] = [
  {
    id: "inheritance-team-member",
    group: "Inheritance",
    name: "Model with multiple inherited fields",
    method: "GET",
    path: "/api/inheritance/team-member",
    run: () => inheritanceGetTeamMember(),
  },
  {
    id: "inheritance-project",
    group: "Inheritance",
    name: "Inherited model with nested inherited models",
    method: "GET",
    path: "/api/inheritance/project",
    run: () => inheritanceGetProject(),
  },
  {
    id: "inheritance-project-body",
    group: "Inheritance",
    name: "Inherited request and response model",
    method: "POST",
    path: "/api/inheritance/project",
    run: () => inheritanceEchoProject(inheritanceProjectBody),
  },

  {
    id: "filter-form-method-attribute",
    group: "Filter form",
    name: "Method attribute with every filter value type",
    method: "GET",
    path: "/api/filter-form/method-attribute",
    run: () =>
      filterFormGetWithMethodAttribute({
        query: { search: "query-search", echo: "query-value" },
        filters: methodAttributeFilters,
      }),
    validate: (value) => {
      const data = asRecord(value);
      assert(
        data.search === "filtered-search",
        "Filter value must override the normal query value.",
      );
      assert(
        data.minScore === 10 && data.maxScore === 50,
        "Number range was not converted correctly.",
      );
      assert(data.active === true, "Boolean string was not converted to true.");
      assert(
        new Date(String(data.createdFrom)).getTime() ===
          filterCreatedFrom.getTime(),
        "Start date was not converted to ISO.",
      );
      assert(
        new Date(String(data.createdTo)).getTime() ===
          filterCreatedTo.getTime(),
        "End date was not converted to ISO.",
      );
      assert(
        Array.isArray(data.categories) &&
          data.categories.join(",") === "city,harbour",
        "OptionValue list was not converted.",
      );
      assert(
        Array.isArray(data.itemIds) && data.itemIds[0] === filterItemId,
        "String list was not sent.",
      );
      assert(
        data.echo === "query-value",
        "Normal query values must remain in the merged query.",
      );
    },
  },
  {
    id: "filter-form-parameter-attribute",
    group: "Filter form",
    name: "Parameter attribute",
    method: "GET",
    path: "/api/filter-form/parameter-attribute",
    run: () =>
      filterFormGetWithParameterAttribute({
        filters: parameterAttributeFilters,
      }),
    validate: (value) => {
      const data = asRecord(value);
      assert(
        data.search === "parameter-attribute",
        "Parameter-level attribute did not generate filter handling.",
      );
      assert(data.active === false, "boolean-button false was not retained.");
    },
  },
  {
    id: "filter-form-required-map",
    group: "Filter form",
    name: "Required map query plus filters",
    method: "GET",
    path: "/api/filter-form/map-items",
    run: () =>
      filterFormGetMapItems({
        query: {
          west: 4.7,
          south: 51.8,
          east: 5.1,
          north: 52.2,
          zoom: 11,
          search: "query-loses",
          echo: "fixed-query-value",
        },
        filters: mapFilters,
      }),
    validate: (value) => {
      const data = asRecord(value);
      assert(
        data.west === 4.7 && data.north === 52.2 && data.zoom === 11,
        "Required map values were not sent.",
      );
      assert(
        data.search === "filter-wins",
        "Filter values must override matching fixed query values.",
      );
      assert(data.minScore === 25, "Map filter number was not sent.");
      assert(
        data.echo === "fixed-query-value",
        "Unrelated fixed query value disappeared.",
      );
    },
  },
  {
    id: "filter-form-unmarked-control",
    group: "Filter form",
    name: "Unmarked endpoint keeps regular query object",
    method: "GET",
    path: "/api/filter-form/unmarked",
    run: () => filterFormGetUnmarked({ search: "regular-query", active: true }),
    validate: (value) => {
      const data = asRecord(value);
      assert(
        data.search === "regular-query" && data.active === true,
        "Regular query generation changed unexpectedly.",
      );
    },
  },
  {
    id: "filter-form-pagination-priority",
    group: "Filter form",
    name: "Pagination keeps buildQuery priority",
    method: "GET",
    path: "/api/filter-form/paged",
    run: () => filterFormGetPaged(pagedFilters, 1, 2, "score", "Desc"),
    validate: (value) => {
      const data = asRecord(value);
      const items = data.data;
      assert(
        Array.isArray(items) && items.length === 2,
        "Paginated filters returned the wrong number of rows.",
      );
      const first = asRecord(items[0], "first paginated item");
      assert(
        first.score === 50,
        "Paginated sorting did not use score descending.",
      );
      assert(
        data.pageNumber === 1 && data.pageSize === 2 && data.totalCount === 2,
        "Pagination metadata is incorrect.",
      );
    },
  },
  {
    id: "filter-form-mixed-fallback",
    group: "Filter form",
    name: "Path plus query falls back to regular parameters",
    method: "GET",
    path: "/api/filter-form/scope/{scope}",
    run: () =>
      filterFormGetMixedPathAndQuery({
        scope: "acceptance",
        search: "mixed-request",
        minScore: 20,
      }),
    validate: (value) => {
      const data = asRecord(value);
      const filter = asRecord(data.filter, "mixed filter");
      assert(data.scope === "acceptance", "Path parameter was not sent.");
      assert(
        filter.search === "mixed-request" && filter.minScore === 20,
        "Mixed query values were not sent.",
      );
    },
  },
  {
    id: "filter-form-header",
    group: "Filter form",
    name: "Header and query parameter generation",
    method: "GET",
    path: "/api/filter-form/header",
    run: () =>
      filterFormGetHeaderAndQuery({
        "x-Test-Run": "frontend-suite",
        search: "header-query",
      }),
    validate: (value) => {
      const data = asRecord(value);
      assert(
        data.testRun === "frontend-suite",
        "Generated header was not received by ASP.NET Core.",
      );
      assert(
        data.search === "header-query",
        "Header endpoint query value was not received.",
      );
    },
  },

  {
    id: "import-products",
    group: "Imports",
    name: "Upload product files",
    method: "POST",
    path: "/api/imports/products",
    run: () => importUploadProductFiles({ files: testFiles(2) }),
  },
  {
    id: "import-supplier",
    group: "Imports",
    name: "Upload supplier file",
    method: "POST",
    path: "/api/imports/supplier",
    run: () => importUploadSupplierFile({ file: testFiles(1)[0] }),
  },
  {
    id: "import-mixed",
    group: "Imports",
    name: "Upload mixed import",
    method: "POST",
    path: "/api/imports/mixed",
    run: () =>
      importUploadMixedImport({
        files: testFiles(2),
        importName: "Frontend suite",
        validateOnly: true,
      }),
  },

  {
    id: "coverage-object",
    group: "Endpoint coverage",
    name: "JSON object response",
    method: "GET",
    path: "/api/endpoint-coverage/object",
    run: () => endpointCoverageGetObject(),
  },
  {
    id: "coverage-array",
    group: "Endpoint coverage",
    name: "JSON array response",
    method: "GET",
    path: "/api/endpoint-coverage/array",
    run: () => endpointCoverageGetArray(),
  },
  {
    id: "coverage-primitive",
    group: "Endpoint coverage",
    name: "Primitive response",
    method: "GET",
    path: "/api/endpoint-coverage/primitive",
    run: () => endpointCoverageGetPrimitive(),
  },
  {
    id: "coverage-dictionary",
    group: "Endpoint coverage",
    name: "Dictionary response",
    method: "GET",
    path: "/api/endpoint-coverage/dictionary",
    run: () => endpointCoverageGetDictionary(),
  },
  {
    id: "coverage-text",
    group: "Endpoint coverage",
    name: "Text response",
    method: "GET",
    path: "/api/endpoint-coverage/text",
    run: () => endpointCoverageGetText(),
  },
  {
    id: "coverage-download",
    group: "Endpoint coverage",
    name: "Blob response",
    method: "GET",
    path: "/api/endpoint-coverage/download",
    run: () => endpointCoverageDownloadFile(),
  },
  {
    id: "coverage-path-query",
    group: "Endpoint coverage",
    name: "Path and query parameters",
    method: "GET",
    path: "/api/endpoint-coverage/{id}/details",
    run: () =>
      endpointCoverageGetPathAndQuery({
        id: "33333333-3333-3333-3333-333333333333",
        includeMetadata: true,
        culture: "nl-NL",
      }),
  },
  {
    id: "coverage-json-body",
    group: "Endpoint coverage",
    name: "JSON request body with 201",
    method: "POST",
    path: "/api/endpoint-coverage/json",
    run: () =>
      endpointCoveragePostJson({
        name: "Created by coverage suite",
        optionalDescription: null,
        count: 5,
        enabled: true,
        tags: ["json", "created"],
      }),
    capture: (data, context) => {
      context.coverageId = extractId(data);
    },
  },
  {
    id: "coverage-primitive-body",
    group: "Endpoint coverage",
    name: "Primitive JSON body",
    method: "POST",
    path: "/api/endpoint-coverage/primitive-body",
    run: () => endpointCoveragePostPrimitiveBody("primitive request body"),
  },
  {
    id: "coverage-url-encoded",
    group: "Endpoint coverage",
    name: "URL-encoded body",
    method: "POST",
    path: "/api/endpoint-coverage/url-encoded",
    run: () =>
      endpointCoveragePostUrlEncoded({
        name: "Form body",
        count: 2,
        enabled: true,
      }),
  },
  {
    id: "coverage-accepted",
    group: "Endpoint coverage",
    name: "202 Accepted response",
    method: "POST",
    path: "/api/endpoint-coverage/accepted",
    run: () =>
      endpointCoveragePostAccepted({
        name: "Accepted request",
        optionalDescription: "queued",
        count: 1,
        enabled: true,
        tags: ["accepted"],
      }),
  },
  {
    id: "coverage-patch",
    group: "Endpoint coverage",
    name: "PATCH request",
    method: "PATCH",
    path: "/api/endpoint-coverage/{id}",
    run: (context) =>
      endpointCoveragePatchJson(
        { id: requireId(context.coverageId, "Coverage ID") },
        { name: "Patched coverage item", enabled: false },
      ),
  },
  {
    id: "coverage-no-content",
    group: "Endpoint coverage",
    name: "204 No Content response",
    method: "DELETE",
    path: "/api/endpoint-coverage/{id}/no-content",
    run: (context) =>
      endpointCoverageDeleteNoContent({
        id: requireId(context.coverageId, "Coverage ID"),
      }),
  },

  {
    id: "runtime-success-callback",
    group: "Runtime behavior",
    name: "Custom success callback",
    method: "GET",
    path: "/api/endpoint-coverage/object",
    run: async () => {
      let callbackCalled = false;
      const result = await endpointCoverageGetObject({
        onSuccess: () => {
          callbackCalled = true;
        },
      });
      assert(callbackCalled, "Custom onSuccess callback was not called.");
      return result;
    },
  },
  {
    id: "runtime-abort",
    group: "Runtime behavior",
    name: "AbortController produces an aborted client error",
    method: "GET",
    path: "/api/endpoint-coverage/delay",
    run: async () => {
      const controller = new AbortController();
      const request = endpointCoverageGetDelayed(
        { milliseconds: 1_000 },
        { params: { signal: controller.signal } },
      );
      window.setTimeout(() => controller.abort(), 20);
      return request;
    },
    expectedFailure: true,
    expectedStatuses: [0],
    validate: (value) => {
      const error = asRecord(value, "abort error");
      assert(
        error.kind === "aborted",
        "Abort did not produce ApiClientError.kind = aborted.",
      );
    },
  },
  {
    id: "runtime-parse-error",
    group: "Runtime behavior",
    name: "Malformed JSON produces a parse client error",
    method: "GET",
    path: "/api/endpoint-coverage/malformed-json",
    run: () => endpointCoverageGetMalformedJson(),
    expectedFailure: true,
    expectedStatuses: [200],
    validate: (value) => {
      const error = asRecord(value, "parse error");
      assert(
        error.kind === "parse",
        "Malformed JSON did not produce ApiClientError.kind = parse.",
      );
    },
  },

  {
    id: "typed-features-pagination-no-query",
    group: "TypedApi features",
    name: "Paginated generic response without query parameters",
    method: "GET",
    path: "/api/typed-api-features/projects",
    run: () => typedApiFeaturesGetProjects(),
    validate: (value) => {
      const data = asRecord(value);
      assert(
        Array.isArray(data.data),
        "Generic pagination data was not generated as an array.",
      );
    },
  },
  {
    id: "typed-features-generic-envelope",
    group: "TypedApi features",
    name: "Generic envelope bindings",
    method: "GET",
    path: "/api/typed-api-features/team-member-envelope",
    run: () => typedApiFeaturesGetTeamMemberEnvelope(),
    validate: (value) => {
      const data = asRecord(value);
      const member = asRecord(data.data, "envelope data");
      assert(
        member.displayName === "Taylor Example",
        "Generic envelope data binding is incorrect.",
      );
      assert(
        Array.isArray(data.relatedItems),
        "Generic collection binding is incorrect.",
      );
      assert(
        typeof data.itemsByKey === "object" && data.itemsByKey !== null,
        "Generic dictionary binding is incorrect.",
      );
    },
  },
  {
    id: "typed-features-nullability-get",
    group: "TypedApi features",
    name: "Required and nullable response properties",
    method: "GET",
    path: "/api/typed-api-features/nullability",
    run: () => typedApiFeaturesGetNullability(),
    validate: (value) => {
      const data = asRecord(value);
      assert(
        data.requiredNullableText === null,
        "Required nullable property was not returned as null.",
      );
      assert("requiredText" in data, "Required non-null property is missing.");
    },
  },
  {
    id: "typed-features-nullability-post",
    group: "TypedApi features",
    name: "Required and nullable request properties",
    method: "POST",
    path: "/api/typed-api-features/nullability",
    run: () => typedApiFeaturesEchoNullability(nullabilityBody),
    validate: (value) => {
      const data = asRecord(value);
      assert(
        data.requiredCount === 7 && data.optionalCount === null,
        "Nullability request was not echoed correctly.",
      );
    },
  },
  {
    id: "typed-features-discriminator-get",
    group: "TypedApi features",
    name: "Polymorphic discriminator response",
    method: "GET",
    path: "/api/typed-api-features/notification",
    run: () => typedApiFeaturesGetNotification(),
    validate: (value) => {
      const data = asRecord(value);
      assert(
        data.kind === "email" && data.subject === "TypedApi discriminator test",
        "Discriminator response was not narrowed correctly.",
      );
    },
  },
  {
    id: "typed-features-discriminator-post",
    group: "TypedApi features",
    name: "Polymorphic discriminator request",
    method: "POST",
    path: "/api/typed-api-features/notification",
    run: () => typedApiFeaturesEchoNotification(emailNotificationBody),
    validate: (value) => {
      const data = asRecord(value);
      assert(
        data.kind === "email" && data.emailAddress === "frontend@example.com",
        "Discriminator request was not echoed correctly.",
      );
    },
  },
  {
    id: "typed-features-validation-error",
    group: "TypedApi features",
    name: "Typed HttpValidationProblemDetails error",
    method: "GET",
    path: "/api/typed-api-features/projects/{id}",
    run: () =>
      typedApiFeaturesGetProjectWithTypedErrors({
        id: "00000000-0000-0000-0000-000000000000",
      }),
    expectedFailure: true,
    expectedStatuses: [400],
    validate: (value) => {
      const error = asRecord(value, "validation problem");
      assert(
        typeof error.errors === "object" && error.errors !== null,
        "Validation errors dictionary is missing.",
      );
    },
  },
  {
    id: "typed-features-problem-error",
    group: "TypedApi features",
    name: "Typed ProblemDetails error and custom error callback",
    method: "GET",
    path: "/api/typed-api-features/projects/{id}",
    run: async () => {
      let callbackCalled = false;
      const result = await typedApiFeaturesGetProjectWithTypedErrors(
        { id: "99999999-9999-9999-9999-999999999999" },
        {
          onError: () => {
            callbackCalled = true;
          },
        },
      );
      assert(callbackCalled, "Custom onError callback was not called.");
      return result;
    },
    expectedFailure: true,
    expectedStatuses: [404],
    validate: (value) => {
      const error = asRecord(value, "problem details");
      assert(
        error.title === "Project not found",
        "ProblemDetails title is incorrect.",
      );
    },
  },

  {
    id: "suppliers-list",
    group: "Suppliers",
    name: "List suppliers",
    method: "GET",
    path: "/api/suppliers",
    run: () => supplierGetSuppliers([], 1, 10, "companyName", "Asc"),
  },
  {
    id: "suppliers-create",
    group: "Suppliers",
    name: "Create supplier",
    method: "POST",
    path: "/api/suppliers",
    run: () => supplierCreateSupplier(supplierBody),
    capture: (data, context) => {
      context.supplierId = extractId(data);
    },
  },
  {
    id: "suppliers-get",
    group: "Suppliers",
    name: "Get supplier by ID",
    method: "GET",
    path: "/api/suppliers/{id}",
    run: (context) =>
      supplierGetSupplierById({
        id: requireId(context.supplierId, "Supplier ID"),
      }),
  },
  {
    id: "suppliers-update",
    group: "Suppliers",
    name: "Update supplier",
    method: "PUT",
    path: "/api/suppliers/{id}",
    run: (context) =>
      supplierUpdateSupplier(
        { id: requireId(context.supplierId, "Supplier ID") },
        {
          ...supplierBody,
          companyName: "Updated Frontend Supplier",
        },
      ),
  },
  {
    id: "suppliers-verify",
    group: "Suppliers",
    name: "Verify supplier",
    method: "POST",
    path: "/api/suppliers/{id}/verify",
    run: (context) =>
      supplierVerifySupplier({
        id: requireId(context.supplierId, "Supplier ID"),
      }),
  },

  {
    id: "products-list",
    group: "Products",
    name: "List products",
    method: "GET",
    path: "/api/products",
    run: () => productGetProducts([], 1, 10, "stock", "Asc"),
  },
  {
    id: "products-sort-state",
    group: "Products",
    name: "Get ApiSortResponse",
    method: "GET",
    path: "/api/products/sort-state",
    run: () =>
      productGetProductSortState({
        sortBy: "price",
        sortDirection: "Desc",
      }),
  },

  {
    id: "products-create",
    group: "Products",
    name: "Create product",
    method: "POST",
    path: "/api/products",
    run: (context) =>
      productCreateProduct(
        productBody(requireId(context.supplierId, "Supplier ID")),
      ),
    capture: (data, context) => {
      context.productId = extractId(data);
    },
  },
  {
    id: "products-get",
    group: "Products",
    name: "Get product by ID",
    method: "GET",
    path: "/api/products/{id}",
    run: (context) =>
      productGetProductById({
        id: requireId(context.productId, "Product ID"),
      }),
  },
  {
    id: "products-update",
    group: "Products",
    name: "Update product",
    method: "PUT",
    path: "/api/products/{id}",
    run: (context) =>
      productUpdateProduct(
        { id: requireId(context.productId, "Product ID") },
        {
          ...productBody(requireId(context.supplierId, "Supplier ID")),
          name: "Updated frontend product",
        },
      ),
  },
  {
    id: "products-toggle",
    group: "Products",
    name: "Toggle product active",
    method: "POST",
    path: "/api/products/{id}/toggle-active",
    run: (context) =>
      productToggleProductActive({
        id: requireId(context.productId, "Product ID"),
      }),
  },
  {
    id: "products-export",
    group: "Products",
    name: "Export products",
    method: "GET",
    path: "/api/products/export",
    run: () => productExportProducts({ search: "Frontend" }),
  },

  {
    id: "warehouses-list",
    group: "Warehouses",
    name: "List warehouses",
    method: "GET",
    path: "/api/warehouses",
    run: () => warehouseGetWarehouses([], 1, 10, "capacity", "Desc"),
  },
  {
    id: "warehouses-create",
    group: "Warehouses",
    name: "Create warehouse",
    method: "POST",
    path: "/api/warehouses",
    run: () => warehouseCreateWarehouse(warehouseBody),
    capture: (data, context) => {
      context.warehouseId = extractId(data);
    },
  },
  {
    id: "warehouses-get",
    group: "Warehouses",
    name: "Get warehouse by ID",
    method: "GET",
    path: "/api/warehouses/{id}",
    run: (context) =>
      warehouseGetWarehouseById({
        id: requireId(context.warehouseId, "Warehouse ID"),
      }),
  },
  {
    id: "warehouses-update",
    group: "Warehouses",
    name: "Update warehouse",
    method: "PUT",
    path: "/api/warehouses/{id}",
    run: (context) =>
      warehouseUpdateWarehouse(
        { id: requireId(context.warehouseId, "Warehouse ID") },
        {
          ...warehouseBody,
          name: "Updated Frontend Warehouse",
        },
      ),
  },

  {
    id: "orders-list",
    group: "Orders",
    name: "List orders",
    method: "GET",
    path: "/api/orders",
    run: () => orderGetOrders([], 1, 10, "orderedAt", "Desc"),
  },
  {
    id: "orders-create",
    group: "Orders",
    name: "Create order",
    method: "POST",
    path: "/api/orders",
    run: (context) =>
      orderCreateOrder(
        orderBody(
          requireId(context.productId, "Product ID"),
          requireId(context.supplierId, "Supplier ID"),
        ),
      ),
    capture: (data, context) => {
      context.orderId = extractId(data);
    },
  },
  {
    id: "orders-get",
    group: "Orders",
    name: "Get order by ID",
    method: "GET",
    path: "/api/orders/{id}",
    run: (context) =>
      orderGetOrderById({ id: requireId(context.orderId, "Order ID") }),
  },
  {
    id: "orders-update",
    group: "Orders",
    name: "Update order",
    method: "PUT",
    path: "/api/orders/{id}",
    run: (context) =>
      orderUpdateOrder(
        { id: requireId(context.orderId, "Order ID") },
        {
          ...orderBody(
            requireId(context.productId, "Product ID"),
            requireId(context.supplierId, "Supplier ID"),
          ),
          quantity: 4,
          totalPrice: 79.8,
        },
      ),
  },
  {
    id: "orders-approve",
    group: "Orders",
    name: "Approve order",
    method: "POST",
    path: "/api/orders/{id}/approve",
    run: (context) =>
      orderApproveOrder({ id: requireId(context.orderId, "Order ID") }),
  },
  {
    id: "orders-cancel",
    group: "Orders",
    name: "Cancel order",
    method: "POST",
    path: "/api/orders/{id}/cancel",
    run: (context) =>
      orderCancelOrder({ id: requireId(context.orderId, "Order ID") }),
  },

  {
    id: "orders-delete",
    group: "Cleanup",
    name: "Delete test order",
    method: "DELETE",
    path: "/api/orders/{id}",
    run: (context) =>
      orderDeleteOrder({ id: requireId(context.orderId, "Order ID") }),
  },
  {
    id: "products-delete",
    group: "Cleanup",
    name: "Delete test product",
    method: "DELETE",
    path: "/api/products/{id}",
    run: (context) =>
      productDeleteProduct({ id: requireId(context.productId, "Product ID") }),
  },
  {
    id: "warehouses-delete",
    group: "Cleanup",
    name: "Delete test warehouse",
    method: "DELETE",
    path: "/api/warehouses/{id}",
    run: (context) =>
      warehouseDeleteWarehouse({
        id: requireId(context.warehouseId, "Warehouse ID"),
      }),
  },
  {
    id: "suppliers-delete",
    group: "Cleanup",
    name: "Delete test supplier",
    method: "DELETE",
    path: "/api/suppliers/{id}",
    run: (context) =>
      supplierDeleteSupplier({
        id: requireId(context.supplierId, "Supplier ID"),
      }),
  },
];

function App() {
  const [results, setResults] = useState<TestResult[]>(
    tests.map((test) => ({ ...test, status: "idle" })),
  );
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const summary = useMemo(
    () => ({
      passed: results.filter((result) => result.status === "passed").length,
      failed: results.filter((result) => result.status === "failed").length,
      completed: results.filter(
        (result) => result.status === "passed" || result.status === "failed",
      ).length,
    }),
    [results],
  );

  const setResult = (id: string, patch: Partial<TestResult>) => {
    setResults((current) =>
      current.map((result) =>
        result.id === id ? { ...result, ...patch } : result,
      ),
    );
  };

  const runTest = async (test: TestDefinition, context: TestContext) => {
    setResult(test.id, {
      status: "running",
      error: undefined,
      response: undefined,
      statusCode: undefined,
    });

    const start = performance.now();

    try {
      const result = await test.run(context);
      const duration = Math.round(performance.now() - start);
      const statusExpected =
        test.expectedStatuses === undefined ||
        test.expectedStatuses.includes(result.status);

      if (result.ok === false) {
        if (!test.expectedFailure || !statusExpected) {
          setResult(test.id, {
            status: "failed",
            statusCode: result.status,
            duration,
            response: result.error,
            error: errorMessage(result.error),
          });

          return false;
        }

        test.validate?.(result.error, context);

        setResult(test.id, {
          status: "passed",
          statusCode: result.status,
          duration,
          response: result.error,
        });

        return true;
      }

      if (test.expectedFailure) {
        throw new Error(
          `Expected the request to fail, but it succeeded with status ${result.status}.`,
        );
      }

      if (!statusExpected) {
        throw new Error(
          `Expected status ${test.expectedStatuses?.join(" or ")}, but received ${result.status}.`,
        );
      }

      test.validate?.(result.response, context);
      test.capture?.(result.response, context);

      setResult(test.id, {
        status: "passed",
        statusCode: result.status,
        duration,
        response: result.response ?? null,
      });

      return true;
    } catch (reason) {
      setResult(test.id, {
        status: "failed",
        duration: Math.round(performance.now() - start),
        error: errorMessage(reason),
      });

      return false;
    }
  };

  const runAll = async () => {
    setRunning(true);
    setExpanded(null);
    setResults(tests.map((test) => ({ ...test, status: "idle" })));

    const context: TestContext = {};

    for (const test of tests) {
      await runTest(test, context);
    }

    setRunning(false);
  };

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [manualUploadEndpoint, setManualUploadEndpoint] = useState<
    "products" | "supplier" | "mixed"
  >("products");
  const [manualUploadResult, setManualUploadResult] = useState<string>("");

  const sendSelectedFiles = async () => {
    if (selectedFiles.length === 0) {
      setManualUploadResult("Select at least one file first.");
      return;
    }

    setManualUploadResult("Uploading...");

    try {
      let result: ApiResult<unknown>;

      if (manualUploadEndpoint === "products") {
        result = await importUploadProductFiles({ files: selectedFiles });
      } else if (manualUploadEndpoint === "supplier") {
        result = await importUploadSupplierFile({ file: selectedFiles[0] });
      } else {
        result = await importUploadMixedImport({
          files: selectedFiles,
          importName: "Manual frontend upload",
          validateOnly: false,
        });
      }

      setManualUploadResult(
        JSON.stringify(
          {
            ok: result.ok,
            status: result.status,
            response: result.response,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      setManualUploadResult(errorMessage(error));
    }
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">TypedApi integration suite</p>
          <h1>Frontend endpoint tester</h1>
          <p className="subtitle">
            Runs all {tests.length} API endpoints through the generated TypedApi
            methods and removes the records it creates.
          </p>
        </div>

        <button className="run-button" onClick={runAll} disabled={running}>
          {running ? (
            <>
              <span className="spinner" /> Running suite
            </>
          ) : (
            "Run all endpoints"
          )}
        </button>
      </header>

      <section className="summary-grid" aria-label="Manual file upload">
        <article style={{ gridColumn: "1 / -1" }}>
          <span>Manual file upload</span>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginTop: "1rem",
            }}
          >
            <input
              type="file"
              multiple
              onChange={(event) =>
                setSelectedFiles(Array.from(event.target.files ?? []))
              }
            />

            <select
              value={manualUploadEndpoint}
              onChange={(event) =>
                setManualUploadEndpoint(
                  event.target.value as typeof manualUploadEndpoint,
                )
              }
            >
              <option value="products">POST /api/imports/products</option>
              <option value="supplier">POST /api/imports/supplier</option>
              <option value="mixed">POST /api/imports/mixed</option>
            </select>

            <button
              className="run-button"
              type="button"
              onClick={sendSelectedFiles}
            >
              Send selected file(s)
            </button>
          </div>

          {manualUploadResult && (
            <pre style={{ marginTop: "1rem" }}>{manualUploadResult}</pre>
          )}
        </article>
      </section>

      <section className="summary-grid" aria-label="Test summary">
        <article>
          <span>Total</span>
          <strong>{tests.length}</strong>
        </article>
        <article>
          <span>Completed</span>
          <strong>{summary.completed}</strong>
        </article>
        <article className="success">
          <span>Passed</span>
          <strong>{summary.passed}</strong>
        </article>
        <article className="failure">
          <span>Failed</span>
          <strong>{summary.failed}</strong>
        </article>
      </section>

      <section className="progress-track" aria-label="Suite progress">
        <div
          style={{ width: `${(summary.completed / tests.length) * 100}%` }}
        />
      </section>

      <section className="test-list">
        {results.map((result, index) => (
          <article className={`test-card ${result.status}`} key={result.id}>
            <button
              className="test-row"
              onClick={() =>
                setExpanded(expanded === result.id ? null : result.id)
              }
            >
              <span className="index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={`method method-${result.method.toLowerCase()}`}>
                {result.method}
              </span>
              <span className="test-info">
                <strong>{result.name}</strong>
                <small>
                  {result.group} · {result.path}
                </small>
              </span>
              <span className="metrics">
                {result.statusCode !== undefined && <b>{result.statusCode}</b>}
                {result.duration !== undefined && (
                  <small>{result.duration} ms</small>
                )}
              </span>
              <span
                className={`status-dot ${result.status}`}
                title={result.status}
              />
            </button>

            {expanded === result.id && (
              <div className="details">
                {result.error && (
                  <p className="error-message">{result.error}</p>
                )}
                <pre>
                  {JSON.stringify(
                    result.response ?? "No response body yet.",
                    null,
                    2,
                  )}
                </pre>
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
