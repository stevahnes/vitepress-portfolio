module.exports = {
  root: true,
  ignorePatterns: [
    "package.json",
    "package-lock.json",
    "node_modules/",
    "dist/",
    ".cache/",
    ".temp/",
    ".vitepress/cache/",
  ],
  env: {
    node: true,
    browser: true,
    es2023: true, // Using the latest fully supported ECMAScript version
  },
  extends: [
    "eslint:recommended",
    "plugin:vue/recommended", // Updated for Vue 3 which VitePress uses
    "plugin:@typescript-eslint/recommended", // For TypeScript support
    "prettier", // Should always be last in the extends array
  ],
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: "latest", // Using "latest" to align with esnext in TypeScript
    sourceType: "module",
  },
  plugins: ["vue", "@typescript-eslint", "markdown"],
  rules: {
    // Vue specific rules
    "vue/require-default-prop": "off", // Optional if you don't want to require default values for props
    "vue/multi-word-component-names": "off", // VitePress often uses single-word component names

    // General rules
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
  },
  overrides: [
    {
      files: ["**/*.md"],
      processor: "markdown/markdown",
    },
    {
      // For code blocks inside markdown files
      files: ["**/*.md/**/*.{js,ts,vue}"],
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
      rules: {
        "vue/html-self-closing": "off", // Markdown sometimes has issues with self-closing tags
        "vue/max-attributes-per-line": "off", // Allow multiple attributes per line in Markdown examples
        "@typescript-eslint/no-unused-vars": "off", // Ignore unused vars in code examples
        "no-undef": "off", // Code snippets might not include all variable declarations
        "no-unused-vars": "off", // Code snippets might not use all declared variables
      },
    },
  ],
};
