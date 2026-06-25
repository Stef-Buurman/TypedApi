import assert from "node:assert/strict";
import test from "node:test";
import {
  createApiClient,
  handleApiResponse,
  fromWireValue,
  mergeHeaders,
  toCookieHeader,
  toRequestHeaders,
  toWireValue,
} from "../dist/esm/index.js";

test("header helpers preserve Headers instances and serialize values", () => {
  const merged = mergeHeaders(new Headers({ Authorization: "Bearer token" }), [["X-Test", "yes"]]);
  assert.equal(merged.get("authorization"), "Bearer token");
  assert.equal(merged.get("x-test"), "yes");

  const requestHeaders = toRequestHeaders({ "X-Ids": [1, 2], empty: undefined });
  assert.equal(requestHeaders.get("x-ids"), "1, 2");
  assert.equal(requestHeaders.has("empty"), false);
  assert.equal(toCookieHeader({ "session id": "a/b" }), "session%20id=a%2Fb");
});

test("cancel token 0 is supported and abort controllers are cleaned up", async () => {
  let calls = 0;
  const client = createApiClient({
    customFetch: async (_url, init) => {
      calls += 1;
      return await new Promise((resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      });
    },
  });

  const pending = client.request({ path: "/slow", method: "GET", cancelToken: 0 });
  client.abortRequest(0);
  await assert.rejects(pending, /Aborted/);
  client.abortRequest(0);
  assert.equal(calls, 1);
});

test("invalid JSON becomes a parse error", async () => {
  const result = await handleApiResponse(async () => new Response("{broken", {
    status: 200,
    headers: { "content-type": "application/json" },
  }));

  assert.equal(result.ok, false);
  assert.equal(result.status, 200);
  assert.equal(result.error.kind, "parse");
  assert.equal(result.error.rawBody, "{broken");
});

test("consumer callback errors propagate instead of becoming API errors", async () => {
  await assert.rejects(
    handleApiResponse(
      async () => new Response('{"ok":true}', {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
      { onSuccess: () => { throw new Error("callback failed"); } },
    ),
    /callback failed/,
  );
});


test("wire mapping lowercases only the first character locally", () => {
  const registry = {
    Product: {
      kind: "object",
      properties: {
        files: { wireName: "Files", schema: { kind: "array", items: { kind: "identity" } } },
        uRLValue: { wireName: "URLValue" },
        nested: { wireName: "Nested", schema: { kind: "ref", ref: "Nested" } },
      },
    },
    Nested: {
      kind: "object",
      properties: {
        displayName: { wireName: "DisplayName" },
      },
    },
  };

  assert.deepEqual(
    toWireValue(
      { files: ["a", "b"], uRLValue: "url", nested: { displayName: "Name" } },
      { kind: "ref", ref: "Product" },
      registry,
    ),
    { Files: ["a", "b"], URLValue: "url", Nested: { DisplayName: "Name" } },
  );

  assert.deepEqual(
    fromWireValue(
      { Files: ["a"], URLValue: "url", Nested: { DisplayName: "Name" } },
      { kind: "ref", ref: "Product" },
      registry,
    ),
    { files: ["a"], uRLValue: "url", nested: { displayName: "Name" } },
  );
});


test("handleApiResponse applies generated response and error transforms", async () => {
  const success = await handleApiResponse(
    async () => new Response('{"DisplayName":"Stef"}', {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
    { transformResponse: (value) => ({ displayName: value.DisplayName }) },
  );
  assert.deepEqual(success, { ok: true, status: 200, response: { displayName: "Stef" } });

  const failure = await handleApiResponse(
    async () => { throw new Response('{"Title":"Bad"}', {
      status: 400,
      headers: { "content-type": "application/json" },
    }); },
    { transformError: (value) => ({ title: value.Title }) },
  );
  assert.equal(failure.ok, false);
  assert.deepEqual(failure.error, { title: "Bad" });
});
