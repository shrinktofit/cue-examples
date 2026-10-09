// @ts-check

import { defineConfig, globalIgnores } from 'eslint/config';
import stf from '@shrinktofit/eslint-config';
import node from '@shrinktofit/eslint-config/node';
import vue from '@shrinktofit/eslint-config/vue';
import vueParser from 'vue-eslint-parser';
import { cueProcessor, cueScriptParser } from './eslint-cue.js';

export default defineConfig([
  globalIgnores([
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
  {
    files: ['**/*.cue'],
    plugins: {
      cue: {
        processors: { sfc: cueProcessor },
      },
    },
    processor: 'cue/sfc',
  },
  ...node.configs.recommended.map((config) => ({
    ...config,
    files: ['eslint*.js', 'scripts/**/*.ts'],
  })),
  ...vue.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.cue/*.vue'],
  })),
  {
    files: ['**/*.cue/*.vue'],
    // Cue preserves template whitespace, so moving literal text changes rendered content.
    rules: {
      'vue/html-indent': [
        'error',
        2,
        { ignores: ['VText'] },
      ],
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
    },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: { ts: cueScriptParser },
      },
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
        project: './tsconfig.eslint.json',
        extraFileExtensions: ['.cue'],
      },
    },
    settings: {
      node: {
        version: '^22.18.0 || >=24.0.0',
      },
    },
  },
]);
