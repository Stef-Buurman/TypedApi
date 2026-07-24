# TypedApi test frontend

See [`../README.md`](../README.md) for setup, endpoint coverage, package versions, and verification commands.

Useful commands:

```powershell
npm run generate:api          # Generate from the running backend
npm run generate:api:offline  # Generate from swagger/swagger.backup.json
npm run generate:api:check    # Fail if checked-in generated files differ
npm run verify:filter-form    # Assert the expected generated method shapes
npm run verify                # Generated check + feature assertions + frontend build
```
