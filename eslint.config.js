// @ts-check

import { defineConfig, globalIgnores } from 'eslint/config';
import stf from '@shrinktofit/eslint-config';
import node from '@shrinktofit/eslint-config/node';
import vue from '@shrinktofit/eslint-config/vue';

export default defineConfig([
  globalIgnores([
    '.validation/',
    '**/temp/',
    '**/library/',
    '**/local/',
    '**/build/',
    '**/native/',
    '**/extensions/',
    '**/assets/oms.ts',
    '**/profiles/v2/packages/',
  ]),
  ...stf.configs.recommended,
  ...stf.configs.conventions,
  ...node.configs.recommended.map((config) => ({
    ...config,
    files: ['eslint*.js', 'scripts/**/*.ts'],
  })),
  ...vue.configs.recommended,
  {
    files: ['**/*.cc.vue'],
    // Cue preserves template whitespace, so moving literal text changes rendered content.
    rules: {
      'vue/first-attribute-linebreak': [
        'error',
        {
          singleline: 'beside',
          multiline: 'below',
        },
      ],
      'vue/html-indent': [
        'error',
        2,
        { ignores: ['VText'] },
      ],
      '@stylistic/max-len': 'off',
      'vue/max-len': [
        'error',
        {
          code: 100,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreRegExpLiterals: true,
          ignoreTemplateLiterals: true,
          ignoreHTMLTextContents: true,
        },
      ],
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
    },
    languageOptions: {
      globals: {
        console: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
      },
    },
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: './tsconfig.lint.json',
        extraFileExtensions: ['.vue'],
      },
    },
    settings: {
      node: {
        version: '^22.18.0 || >=24.0.0',
      },
    },
  },
]);
