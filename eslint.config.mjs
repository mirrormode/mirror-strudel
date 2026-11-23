import _import from 'eslint-plugin-import';
import { fixupPluginRules } from '@eslint/compat';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import { jsdoc } from 'eslint-plugin-jsdoc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      '**/krill-parser.js',
      '**/krill.pegjs',
      '**/.eslintrc.json',
      '**/server.js',
      '**/tidal-sniffer.js',
      '**/*.jsx',
      '**/tunejs.js',
      'out/**/*',
      '**/postcss.config.js',
      '**/postcss.config.cjs',
      '**/tailwind.config.js',
      '**/tailwind.config.cjs',
      '**/vite.config.js',
      '**/dist/**/*',
      '!**/*.mjs',
      '**/*.tsx',
      '**/*.ts',
      '**/*.json',
      '**/dev-dist',
      '**/dist',
      'src-tauri/target/**/*',
      '**/reverbGen.mjs',
      '**/hydra.mjs',
      '**/jsdoc-synonyms.js',
      'packages/hs2js/src/hs2js.mjs',
      '**/samples',
    ],
  },
  ...compat.extends('eslint:recommended').map((config) => ({
    ...config,
    files: ['**/*.mjs', '**/*.js'],
  })),
  {
    files: ['**/*.mjs', '**/*.js'],

    plugins: {
      import: fixupPluginRules(_import),
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },

      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    rules: {
      'no-unused-vars': [
        'warn',
        {
          destructuredArrayIgnorePattern: '.',
          ignoreRestSiblings: false,
        },
      ],

      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true,
        },
      ],
    },
  },
  {
    // Properties provided by AudioWorkletGlobalScope
    files: ['packages/superdough/worklets.mjs'],
    languageOptions: {
      globals: {
        currentTime: 'readonly',
        sampleRate: 'readonly',
      },
    },
  },
  jsdoc({
    config: 'flat/recommended-error',
    rules: {
      "jsdoc/no-undefined-types": ["error", { definedTypes: ["Pattern", "Hap", "KabelsalatExpression"] }],
      "jsdoc/no-defaults": 0, //removes defaults with not alternative
      "jsdoc/require-jsdoc": 0,
      "jsdoc/check-tag-names": 0,
      "jsdoc/tag-lines": 0,
      "jsdoc/require-returns-description": 0,
      "jsdoc/require-param-description": 0,
      "jsdoc/no-multi-asterisks": 0,
      "jsdoc/multiline-blocks": 0,
      "jsdoc/check-alignment": 0,
      "jsdoc/reject-any-type": 0,
      "jsdoc/reject-function-type": 0
    }
  })
];
