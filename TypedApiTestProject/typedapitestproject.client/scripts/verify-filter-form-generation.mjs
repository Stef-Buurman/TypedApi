import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDirectory, "..");
const methodFile = path.join(clientRoot, "src/api/methods/FilterForm.api.ts");
const packageFile = path.join(clientRoot, "node_modules/typedapi-client-helpers/package.json");

const source = fs.readFileSync(methodFile, "utf8");
const installedPackage = JSON.parse(fs.readFileSync(packageFile, "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function methodSource(methodName) {
  const start = source.indexOf(`export async function ${methodName}(`);
  assert(start >= 0, `Generated method ${methodName} is missing.`);
  const next = source.indexOf("\n/**", start + 1);
  return source.slice(start, next >= 0 ? next : source.length);
}

assert(installedPackage.version === "0.3.5", `Expected typedapi-client-helpers 0.3.5, found ${installedPackage.version}.`);

const methodAttribute = methodSource("filterFormGetWithMethodAttribute");
assert(methodAttribute.includes("filters: FilterFormValues<"), "Method-level attribute did not generate FilterFormValues.");
assert(methodAttribute.includes("buildFilterQuery<"), "Method-level attribute did not generate buildFilterQuery.");

const parameterAttribute = methodSource("filterFormGetWithParameterAttribute");
assert(parameterAttribute.includes("filters: FilterFormValues<"), "Parameter-level attribute did not generate FilterFormValues.");

const mapMethod = methodSource("filterFormGetMapItems");
assert(/query: FilterFormGetMapItemsQueryParams,/.test(mapMethod), "Required map query incorrectly received a default value.");
assert(mapMethod.includes("...query"), "Map fixed query values are not merged.");
assert(mapMethod.includes("...buildFilterQuery"), "Map filter-form values are not merged.");

const unmarkedMethod = methodSource("filterFormGetUnmarked");
assert(!unmarkedMethod.includes("FilterFormValues<"), "Unmarked endpoint unexpectedly generated FilterFormValues.");
assert(unmarkedMethod.includes("query: query"), "Unmarked endpoint is not using the regular query object.");

const pagedMethod = methodSource("filterFormGetPaged");
assert(pagedMethod.includes("buildQuery<"), "Paginated endpoint no longer generates buildQuery.");
assert(!pagedMethod.includes("buildFilterQuery<"), "Paginated endpoint incorrectly uses the non-paginated builder.");

const mixedMethod = methodSource("filterFormGetMixedPathAndQuery");
assert(!mixedMethod.includes("FilterFormValues<"), "Mixed path/query endpoint should fall back to regular parameters.");
assert(mixedMethod.includes("pathParams: FilterFormGetMixedPathAndQueryParams"), "Mixed endpoint did not generate its combined parameter object.");

const headerMethod = methodSource("filterFormGetHeaderAndQuery");
assert(headerMethod.includes("toRequestHeaders"), "Header parameter helper was not generated.");
assert(headerMethod.includes('"X-Test-Run"'), "Header wire name was not preserved.");

console.log("Filter-form generation matrix verified.");
