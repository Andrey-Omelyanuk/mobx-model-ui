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
      "semi": ["error", "never"],
      "linebreak-style": ["error", "unix"],
      "max-lines": ["warn", { max: 400 }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-empty-object-type": ["error", {
        "allowInterfaces": "with-single-extends"
      }],
    },
  },
  {
    ignores: ["node_modules/**", "dist/**", "lib/**", "e2e/**", "**/*.spec.ts", "src/test.utils.ts"],
  }
);
