import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import vitest from "eslint-plugin-vitest";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  {
    rules: {
      // Keep visibility on legacy-large files while allowing progress in this branch.
      complexity: ["warn", { max: 10 }],
      eqeqeq: ["warn", "always"],
      "max-lines": ["error", { max: 200 }],
      "max-params": ["error", { max: 5 }],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-fallthrough": ["error", { allowEmptyCase: true }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='only']",
          message: "We don't want to leave .only on our tests",
        },
      ],
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "react-hooks/set-state-in-effect": "warn",
    },
  },

  {
    files: ["tests/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.tests.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },

  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@prisma/client"],
              message:
                "Import db from @/lib/db instead of using PrismaClient directly.",
            },
          ],
        },
      ],
    },
  },

  {
    files: ["tests/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },

  {
    files: ["tests/unit/**/*.test.ts"],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
    },
  },

  {
    files: [
      "prisma/seed.ts",
      "scripts/**/*.{js,mjs,ts}",
      "server.js",
      "src/instrumentation*.ts",
    ],
    rules: {
      "max-lines": "off",
      complexity: "off",
    },
  },

  prettier,
]);

export default eslintConfig;
