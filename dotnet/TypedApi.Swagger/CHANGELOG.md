# Changelog

All notable changes to `TypedApi.Swagger` are documented in this file.

## [0.3.1] - 2026-07-22

### Added

* Enabled OpenAPI `allOf` schemas for normal .NET inheritance by default.
* Enabled OpenAPI `oneOf` schemas for polymorphic base models by default.
* Added automatic discovery of concrete subclasses from the base type assembly.
* Added safe subtype discovery when an assembly raises `ReflectionTypeLoadException`.

### Compatibility notes

* Projects only need to call `builder.Services.AddTypedApiSwagger()` to enable these conventions.
* The optional configuration callback still runs after the package defaults and can override subtype selection.

## [0.3.0] - 2026-07-10

### Added

* Added the root `x-typedapi` OpenAPI contract marker.
* Added `contractVersion`, producer name, and producer version metadata.
* Added `x-typedapi-operation` metadata containing the original ASP.NET controller and action names.
* Added `x-typedapi-pagination` metadata for responses implementing `IApiPaginationResponse<T>`.
* Added serializer-aware required-property detection using `JsonSerializerOptions.PropertyNamingPolicy`.
* Added support for `[JsonPropertyName]` when determining OpenAPI property names.
* Added support for `[Required]` and `JsonRequiredAttribute`.
* Added support for `[JsonIgnore(Condition = JsonIgnoreCondition.Always)]`.
* Added enum wire-name support for `[EnumMember(Value = "...")]`.
* Added support for `JsonStringEnumMemberNameAttribute`.
* Added `x-enumFlags` metadata for enums marked with `[Flags]`.
* Added validation requiring `PageNumber` to be at least `1`.
* Added SourceLink, deterministic builds, XML documentation, symbol packages, and NuGet package validation.
* Added explicit support for .NET 8 and .NET 10.

### Changed

* Operation IDs are now generated from the controller, action, HTTP method, and route instead of only the action name.
* Explicitly named routes remain the preferred source for stable operation IDs.
* Generated operation IDs are sanitized into valid OpenAPI identifiers.
* Required-property detection now uses `NullabilityInfoContext` instead of reading compiler-generated nullable attributes directly.
* Required-property detection now follows the configured System.Text.Json naming policy.
* Enum schemas now expose the same string values used by runtime JSON serialization.
* Repeated calls to `AddTypedApiJsonOptions()` no longer add duplicate `JsonStringEnumConverter` instances.
* `TotalRecords` now acts as a compatibility alias for `TotalCount` instead of storing an independent value.
* `TotalRecords` is marked obsolete in favour of `TotalCount`.
* Package metadata now includes repository information, release notes, a project URL, and embedded source information.

### Compatibility notes

* Operation IDs may change after upgrading from version `0.2.2`.
* Give routes an explicit `Name` when an operation ID must remain stable.
* Existing code using `TotalRecords` continues to work but receives an obsolete warning.
* `PageNumber` is validated by the package.
* `PageSize` does not currently have a built-in range restriction.
* Document non-success response bodies with `[ProducesResponseType]` so the TypeScript generator can create typed error unions.
* Pair this package with `typedapi-client-helpers` version `0.3.0` or newer.
