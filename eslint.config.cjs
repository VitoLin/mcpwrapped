module.exports = [
  {
    files: ["src/**/*.{js,ts,jsx,tsx}"],
    languageOptions: {
      // Use the TypeScript parser so ESLint can parse `interface` and type annotations
      parser: require("@typescript-eslint/parser"),
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    // Load the TypeScript plugin (installed as devDependency)
    plugins: {
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
    },
    ignores: ["node_modules/**", "dist/**"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
];
