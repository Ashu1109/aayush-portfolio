import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored registry code (shadcn / ai-elements / canvasui) — regenerated
    // by their CLIs, so lint fixes here get overwritten on the next update.
    "components/ui/**",
    "components/ai-elements/**",
    "components/canvasui/**",
  ]),
]);

export default eslintConfig;
