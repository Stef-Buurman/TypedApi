import { useMemo, useState } from "react";
import "./App.css";

import {
  uploadMixedImport,
  uploadProductFiles,
  uploadSupplierFile,
} from "./api/methods/Import.api";
import {
  approveOrder,
  cancelOrder,
  createOrder,
  deleteOrder,
  getOrderById,
  getOrders,
  updateOrder,
} from "./api/methods/Order.api";
import {
  createProduct,
  deleteProduct,
  exportProducts,
  getProductById,
  getProducts,
  toggleProductActive,
  updateProduct,
} from "./api/methods/Product.api";
import {
  createSupplier,
  deleteSupplier,
  getSupplierById,
  getSuppliers,
  updateSupplier,
  verifySupplier,
} from "./api/methods/Supplier.api";
import {
  createWarehouse,
  deleteWarehouse,
  getWarehouseById,
  getWarehouses,
  updateWarehouse,
} from "./api/methods/Warehouse.api";
import type { ApiResult } from "typedapi-client-helpers";
import type { OrderRequest } from "./api/generated/data-contracts";

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
};

type GeneratedResult = ApiResult<unknown>;

type TestDefinition = Omit<TestResult, "status"> & {
  run: (context: TestContext) => Promise<GeneratedResult>;
  capture?: (data: unknown, context: TestContext) => void;
};

const noToasts = {
  toastSuccess: undefined,
  toastError: undefined,
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
  status: 0 as unknown as OrderRequest["status"],
});

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

const tests: TestDefinition[] = [
  {
    id: "import-products",
    group: "Imports",
    name: "Upload product files",
    method: "POST",
    path: "/api/imports/products",
    run: () => uploadProductFiles({ Files: testFiles(2) }, noToasts),
  },
  {
    id: "import-supplier",
    group: "Imports",
    name: "Upload supplier file",
    method: "POST",
    path: "/api/imports/supplier",
    run: () => uploadSupplierFile({ File: testFiles(1)[0] }, noToasts),
  },
  {
    id: "import-mixed",
    group: "Imports",
    name: "Upload mixed import",
    method: "POST",
    path: "/api/imports/mixed",
    run: () =>
      uploadMixedImport(
        {
          Files: testFiles(2),
          ImportName: "Frontend suite",
          ValidateOnly: true,
        },
        noToasts,
      ),
  },

  {
    id: "suppliers-list",
    group: "Suppliers",
    name: "List suppliers",
    method: "GET",
    path: "/api/suppliers",
    run: () => getSuppliers([], 1, 10),
  },
  {
    id: "suppliers-create",
    group: "Suppliers",
    name: "Create supplier",
    method: "POST",
    path: "/api/suppliers",
    run: () => createSupplier(supplierBody, noToasts),
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
      getSupplierById({ id: requireId(context.supplierId, "Supplier ID") }),
  },
  {
    id: "suppliers-update",
    group: "Suppliers",
    name: "Update supplier",
    method: "PUT",
    path: "/api/suppliers/{id}",
    run: (context) =>
      updateSupplier(
        { id: requireId(context.supplierId, "Supplier ID") },
        {
          ...supplierBody,
          companyName: "Updated Frontend Supplier",
        },
        noToasts,
      ),
  },
  {
    id: "suppliers-verify",
    group: "Suppliers",
    name: "Verify supplier",
    method: "POST",
    path: "/api/suppliers/{id}/verify",
    run: (context) =>
      verifySupplier(
        { id: requireId(context.supplierId, "Supplier ID") },
        noToasts,
      ),
  },

  {
    id: "products-list",
    group: "Products",
    name: "List products",
    method: "GET",
    path: "/api/products",
    run: () => getProducts([], 1, 10),
  },
  {
    id: "products-create",
    group: "Products",
    name: "Create product",
    method: "POST",
    path: "/api/products",
    run: (context) =>
      createProduct(
        productBody(requireId(context.supplierId, "Supplier ID")),
        noToasts,
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
      getProductById({ id: requireId(context.productId, "Product ID") }),
  },
  {
    id: "products-update",
    group: "Products",
    name: "Update product",
    method: "PUT",
    path: "/api/products/{id}",
    run: (context) =>
      updateProduct(
        { id: requireId(context.productId, "Product ID") },
        {
          ...productBody(requireId(context.supplierId, "Supplier ID")),
          name: "Updated frontend product",
        },
        noToasts,
      ),
  },
  {
    id: "products-toggle",
    group: "Products",
    name: "Toggle product active",
    method: "POST",
    path: "/api/products/{id}/toggle-active",
    run: (context) =>
      toggleProductActive(
        { id: requireId(context.productId, "Product ID") },
        noToasts,
      ),
  },
  {
    id: "products-export",
    group: "Products",
    name: "Export products",
    method: "GET",
    path: "/api/products/export",
    run: () => exportProducts({ search: "Frontend" }),
  },

  {
    id: "warehouses-list",
    group: "Warehouses",
    name: "List warehouses",
    method: "GET",
    path: "/api/warehouses",
    run: () => getWarehouses([], 1, 10),
  },
  {
    id: "warehouses-create",
    group: "Warehouses",
    name: "Create warehouse",
    method: "POST",
    path: "/api/warehouses",
    run: () => createWarehouse(warehouseBody, noToasts),
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
      getWarehouseById({
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
      updateWarehouse(
        { id: requireId(context.warehouseId, "Warehouse ID") },
        {
          ...warehouseBody,
          name: "Updated Frontend Warehouse",
        },
        noToasts,
      ),
  },

  {
    id: "orders-list",
    group: "Orders",
    name: "List orders",
    method: "GET",
    path: "/api/orders",
    run: () => getOrders([], 1, 10),
  },
  {
    id: "orders-create",
    group: "Orders",
    name: "Create order",
    method: "POST",
    path: "/api/orders",
    run: (context) =>
      createOrder(
        {
          request: orderBody(
            requireId(context.productId, "Product ID"),
            requireId(context.supplierId, "Supplier ID"),
          ),
        } as unknown as ReturnType<typeof orderBody>,
        noToasts,
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
      getOrderById({ id: requireId(context.orderId, "Order ID") }),
  },
  {
    id: "orders-update",
    group: "Orders",
    name: "Update order",
    method: "PUT",
    path: "/api/orders/{id}",
    run: (context) =>
      updateOrder(
        { id: requireId(context.orderId, "Order ID") },
        {
          request: {
            ...orderBody(
              requireId(context.productId, "Product ID"),
              requireId(context.supplierId, "Supplier ID"),
            ),
            quantity: 4,
            totalPrice: 79.8,
          },
        } as unknown as ReturnType<typeof orderBody>,
        noToasts,
      ),
  },
  {
    id: "orders-approve",
    group: "Orders",
    name: "Approve order",
    method: "POST",
    path: "/api/orders/{id}/approve",
    run: (context) =>
      approveOrder({ id: requireId(context.orderId, "Order ID") }, noToasts),
  },
  {
    id: "orders-cancel",
    group: "Orders",
    name: "Cancel order",
    method: "POST",
    path: "/api/orders/{id}/cancel",
    run: (context) =>
      cancelOrder({ id: requireId(context.orderId, "Order ID") }, noToasts),
  },

  {
    id: "orders-delete",
    group: "Cleanup",
    name: "Delete test order",
    method: "DELETE",
    path: "/api/orders/{id}",
    run: (context) =>
      deleteOrder({ id: requireId(context.orderId, "Order ID") }, noToasts),
  },
  {
    id: "products-delete",
    group: "Cleanup",
    name: "Delete test product",
    method: "DELETE",
    path: "/api/products/{id}",
    run: (context) =>
      deleteProduct(
        { id: requireId(context.productId, "Product ID") },
        noToasts,
      ),
  },
  {
    id: "warehouses-delete",
    group: "Cleanup",
    name: "Delete test warehouse",
    method: "DELETE",
    path: "/api/warehouses/{id}",
    run: (context) =>
      deleteWarehouse(
        { id: requireId(context.warehouseId, "Warehouse ID") },
        noToasts,
      ),
  },
  {
    id: "suppliers-delete",
    group: "Cleanup",
    name: "Delete test supplier",
    method: "DELETE",
    path: "/api/suppliers/{id}",
    run: (context) =>
      deleteSupplier(
        { id: requireId(context.supplierId, "Supplier ID") },
        noToasts,
      ),
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

      if (!result.ok) {
        setResult(test.id, {
          status: "failed",
          statusCode: result.status,
          duration,
          response: result.response,
          error: errorMessage(result.error),
        });

        return false;
      }

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
        result = await uploadProductFiles({ Files: selectedFiles }, noToasts);
      } else if (manualUploadEndpoint === "supplier") {
        result = await uploadSupplierFile({ File: selectedFiles[0] }, noToasts);
      } else {
        result = await uploadMixedImport(
          {
            Files: selectedFiles,
            ImportName: "Manual frontend upload",
            ValidateOnly: false,
          },
          noToasts,
        );
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
