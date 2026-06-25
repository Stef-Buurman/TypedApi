# Changelog

## 0.3.1

- Retry transient Windows filesystem errors during generated-output replacement.
- Fall back to rollback-protected managed-file synchronization when `src/api` cannot be renamed because an editor, TypeScript watcher, antivirus scanner, or development server holds a directory handle.
- Preserve unmanaged files while removing stale TypedApi-generated files in fallback mode.

## 0.3.0

- Preserve OpenAPI property names exactly.
- Validate and sanitize operation IDs.
- Add combined path/query/header/cookie/body requests.
- Add typed documented errors and structured client errors.
- Add local `$ref` and `allOf` support.
- Add transactional generation, manifest, barrel exports, and CI check mode.
- Add strict/offline/verbose CLI modes and download timeout.
- Improve Fetch cancellation, timeout, headers, SSR handling, and response parsing.
- Replace the bundler-dependent build with a deterministic TypeScript-only ESM/CJS/declaration build.
