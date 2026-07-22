## 0.0.5 - 2026-07-22

- Added TypedApi.Swagger 0.3.1 + client 0.3.4 generic reconstruction examples.
- Added required/nullability contract coverage.
- Added discriminator-based notification models.
- Added readable generic schema-ID coverage.
- Added typed ProblemDetails endpoint coverage.
- Added generated-client verification and TypeScript compilation checks.
- Added regression coverage preventing `OrderModel[]` from leaking into `ApiPaginationSortResponse<T>`.

This file explains how Visual Studio created the project.

The following steps were used to generate this project:
- Create new ASP\.NET Core Web API project.
- Update project file to add a reference to the frontend project and set SPA properties.
- Update `launchSettings.json` to register the SPA proxy as a startup assembly.
- Add project to the startup projects list.
- Write this file.
