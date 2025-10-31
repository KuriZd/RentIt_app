// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: [
      "dist/*",
      "node_modules/*",
      "supabase/functions/**", // ⚙️ ignora Edge Functions Deno
    ],
    rules: {
      // ⚠️ Evita error de import/no-unresolved con jsr:
      "import/no-unresolved": [
        "error",
        {
          ignore: ["^jsr:"],
        },
      ],

      // Otras buenas prácticas:
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
    },
  },
]);
