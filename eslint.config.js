import pluginVue from "eslint-plugin-vue";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import tsParser from "@typescript-eslint/parser";

export default [
  ...pluginVue.configs["flat/recommended"],
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
    },
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/no-unused-components": "off",
      "vue/require-toggle-inside-transition": "off",
      "vue/require-v-for-key": "off",
      "vue/valid-v-model": "off",
    },
  },
];
