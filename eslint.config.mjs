import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "components/providers.tsx",
      "components/auth-form.tsx",
      "components/cart-page.tsx",
    ],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Registry sources remain byte-for-byte unmodified.
    "components/ui/**",
    "hooks/use-mobile.ts",
    "hooks/use-as-ref.ts",
    "hooks/use-isomorphic-layout-effect.ts",
    "hooks/use-lazy-ref.ts",
  ]),
])

export default eslintConfig
