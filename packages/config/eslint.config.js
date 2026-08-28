// @ts-check
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const prettierConfig = require("eslint-config-prettier");

/** 각 패키지의 eslint.config.js에서 `...require("@ongod/config/eslint.config.js")`로 확장한다. */
module.exports = [
  {
    ignores: ["dist/**", ".next/**", ".expo/**", "node_modules/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  prettierConfig,
];
