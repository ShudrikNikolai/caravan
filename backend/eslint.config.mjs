// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const modules = ['auth', 'user', 'caravan', 'health'];

const moduleBoundaryConfigs = modules.map((moduleName) => ({
  files: [`src/modules/${moduleName}/**/*.ts`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: modules
          .filter((otherModule) => otherModule !== moduleName)
          .map((otherModule) => ({
            group: [`@/modules/${otherModule}/*`],
            message: `Import the public API from '@/modules/${otherModule}', not its internals.`,
          })),
      },
    ],
  },
}));

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "@typescript-eslint/no-empty-interface": "off",
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  ...moduleBoundaryConfigs,
);
