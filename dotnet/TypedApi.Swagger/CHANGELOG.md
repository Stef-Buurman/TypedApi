# Changelog

All notable changes to `TypedApi.Swagger` are documented in this file.

## [0.3.2] - 2026-07-24

### Added

* Added `[TypedApiFilterForm]` for opt-in filter-form generation on endpoints or query parameters.
* Added `x-typedapi-filter-form` operation metadata for the TypeScript generator.

### Compatibility notes

* Pair this package with `typedapi-client-helpers` 0.3.5 or newer to generate the new filter-form method shape.
* Existing automatic pagination detection remains unchanged.

## [0.3.1] - 2026-07-22

### Added

* Added `[TypedApiGeneric]` and `x-typedapi-generic` metadata for reconstructing closed .NET generic contracts as reusable TypeScript generics.
* Added exact generic bindings for direct values, arrays and collections, and dictionary values.
* Added readable generic schema IDs such as `ApiPaginationResponseOfProjectModel`.
* Added attribute-driven discriminator names and values from `[JsonPolymorphic]` and `[JsonDerivedType]`.
* Added typed default `400` (`HttpValidationProblemDetails`) and `500` (`ProblemDetails`) response schemas.
* Added schema completion for explicitly declared error responses that do not specify a body type.
* Enabled OpenAPI `allOf` schemas for normal .NET inheritance by default.
* Enabled OpenAPI `oneOf` schemas for polymorphic base models by default.
* Added automatic discovery of concrete subclasses from the base type assembly.
* Added safe subtype discovery when an assembly raises `ReflectionTypeLoadException`.

### Changed

* Required-property presence and nullable values are now described independently.
* Required detection now supports `[Required]`, `[JsonRequired]`, and the C# `required` keyword without incorrectly removing null from required nullable properties.
* Explicit `[JsonDerivedType]` declarations are preferred over assembly scanning for subtype discovery.
* `ApiPaginationResponse<T>` and `ApiPaginationSortResponse<T>` now opt in to frontend generic reconstruction.
* The TypedApi OpenAPI contract version is now `2`.

### Fixed

* Fixed inherited generic properties such as `ApiPaginationSortResponse<T>.Data` not receiving a generic binding when Swagger flattens inheritance.
* Added explicit generic-base metadata so the frontend can reconstruct `ApiPaginationSortResponse<T>` from `ApiPaginationResponse<T>` even when Swagger flattens all inherited properties.

### Compatibility notes

* Pair this package with `typedapi-client-helpers` 0.3.4 or newer.
* OpenAPI component names for closed generic types are now readable `...Of...` names and therefore differ from earlier 0.3.x output.
* Regenerate committed frontend API files after upgrading.
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
