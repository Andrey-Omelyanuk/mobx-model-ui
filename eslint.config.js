import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      indent: ["error", 4],
      quotes: ["error", "single", { avoidEscape: true }],
      "@typescript-eslint/semi": ["error", "never"],
      "linebreak-style": ["error", "unix"],
      "max-lines-per-file": ["warn", { max: 400 }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    ignores: ["node_modules/**", "dist/**", "lib/**", "e2e/**", "**/*.spec.ts"],
  }
);
