# Changelog

All notable changes to `typedapi-client-helpers` are documented in this file.

## [0.3.0] - 2026-07-10

### Added

* Added serializer-aware wire mapping through `toWireValue()` and `fromWireValue()`.
* Added support for exact OpenAPI property names in JSON bodies, multipart forms, query parameters, headers, cookies, path parameters, responses, and documented error bodies.
* Added support for path, query, header, cookie, and request-body inputs in the same operation.
* Added typed unions for documented non-success response bodies.
* Added structured client errors for network failures, aborted requests, and malformed responses.
* Added support for local OpenAPI `$ref` values in schemas, parameters, path items, request bodies, and responses.
* Added support for `allOf` schemas with additional local properties.
* Added configurable frontend method naming through `typedApiMethodNameStyle`.
* Added `typedApiPrefixMethodNamesWithController` for controller-prefixed action names.
* Added controller-name fallback detection from TypedApi metadata, OpenAPI tags, and route paths.
* Added generated root `index.ts` barrel exports.
* Added `typedapi.manifest.json` containing generator, contract, source, and naming information.
* Added `--check`, `--strict`, `--offline`, and `--verbose` generator modes.
* Added configurable Swagger download timeouts.
* Added global and per-request timeout support.
* Added support for external `AbortSignal` values and combined cancellation signals.
* Added header and cookie utilities through `mergeHeaders()`, `toRequestHeaders()`, and `toCookieHeader()`.
* Added automated generator and runtime tests.

### Changed

* Generated TypeScript property names now lowercase only the first character while preserving the remainder of the OpenAPI name.
* Generated operation IDs and TypeScript identifiers are validated and sanitized before files are written.
* Missing operation IDs now cause a clear error by default.
* Missing operation IDs can optionally be generated with `typedApiGenerateMissingOperationIds`.
* Action-based names can include the controller name by default, preventing collisions between actions with the same name in different controllers.
* Controller prefixes are not duplicated when an action name already begins with the controller name.
* Generated method signatures now keep non-body parameters, request bodies, and request options in predictable argument groups.
* Body-only operations now accept their payload directly without an additional request wrapper.
* Query-only and paginated operations now use more specific generated query types.
* Documented backend errors are returned alongside structured TypedApi client errors.
* Malformed JSON is now returned as a structured parse error instead of being cast to the expected response type.
* Exceptions thrown by consumer `onSuccess` and `onError` callbacks now propagate normally.
* Fetch header merging now uses the native `Headers` implementation.
* File, Blob, FormData, and multipart handling is safer in SSR and Node.js environments.
* Binary image, PDF, and octet-stream responses are handled as blobs.
* The package build now uses a deterministic TypeScript-only ESM, CommonJS, and declaration build instead of a bundler-dependent build.

### Fixed

* Fixed generated-output replacement failures caused by transient Windows filesystem locks.
* Added retries for filesystem errors encountered while replacing generated output.
* Added rollback-protected managed-file synchronization when `src/api` cannot be renamed because an editor, TypeScript watcher, antivirus scanner, or development server holds a directory handle.
* Preserved unmanaged files during fallback synchronization.
* Removed stale TypedApi-generated files during fallback synchronization.
* Fixed handling of cancel token `0`.
* Fixed abort-controller cleanup after completed requests.
* Fixed URLs that already contain query strings.
* Fixed absolute URL handling.
* Fixed duplicate generated method and type names after TypeScript normalization.
* Fixed property-name collisions caused by first-character normalization.

### Migration notes

* OpenAPI 3.x is now required. Swagger 2.0 documents are rejected.
* Regenerated method names, parameter types, property names, and method signatures may differ from version `0.2.1`.
* Projects using `typedApiMethodNameStyle: "action"` receive controller-prefixed names by default.
* Set `typedApiPrefixMethodNamesWithController` to `false` to generate action-only names.
* Set `typedApiGenerateMissingOperationIds` to `true` only when operation IDs cannot be supplied by the backend.
* Regenerate and review committed API files after upgrading.
