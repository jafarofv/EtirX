import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  // Generated / vendored / non-source paths
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "backend/**",
      "**/*.config.js",
      "**/*.config.ts",
      "vite.config.ts",
    ],
  },

  // App source (TypeScript + React)
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.es2022 },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Correctness — keep as errors
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Stylistic / incremental — warn so adoption isn't blocked
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // Vendored shadcn/ui primitives — relax noisy rules (not our code to refactor)
  {
    files: ["src/app/components/ui/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "react-refresh/only-export-components": "off",
      "no-empty": "off",
    },
  },

  // Disable formatting rules that conflict with Prettier
  prettier,
);
