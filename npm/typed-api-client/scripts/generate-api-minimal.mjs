import { generateTypedApi } from './generator/index.mjs';

generateTypedApi().catch((error) => {
  console.error(error);
  process.exit(1);
});
