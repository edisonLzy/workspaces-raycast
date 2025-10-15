import { fileURLToPath, URL } from 'node:url';
import js from '@eslint/js';
import tsEslint from 'typescript-eslint';
import { includeIgnoreFile } from '@eslint/compat';
import stylistic from '@stylistic/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

/**
 * @type {import('eslint').Linter.Config[]} 
 */
export default [
  includeIgnoreFile(gitignorePath),
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    }
  },
  {
    rules: {
      ...js.configs.recommended.rules,
      'object-shorthand': ['error', 'always'],
    }
  },
  ...tsEslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': 'error'
    }
  },
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/indent': ['error', 2],
      '@stylistic/no-multi-spaces': 'error',
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: ['function', 'export']
        },
        {
          blankLine: 'always',
          prev: ['import', 'export'],
          next: '*' // Match any statement after import/export
        },
        {
          blankLine: 'never',
          prev: ['import'],
          next: ['import'] // Only for import pairs
        },
      ],
      '@stylistic/no-multiple-empty-lines': ['error', {
        max: 1,
        maxEOF: 0,
      }],
    }
  },
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'no-unused-vars': 'off', // or "@typescript-eslint/no-unused-vars": "off",
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          'vars': 'all',
          'varsIgnorePattern': '^_',
          'args': 'after-used',
          'argsIgnorePattern': '^_'
        },
      ]
    }
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'], // 指定要检查的文件类型
    plugins: {
      import: importPlugin, // 导入并注册eslint-plugin-import
    },
    rules: {
      'import/named': 'error',
      'import/default': 'off',
      'import/export': 'error',
      'import/no-cycle': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'type',
          ],
        },
      ]
    },
  },
];
