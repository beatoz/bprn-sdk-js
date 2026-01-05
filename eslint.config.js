const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  // 무시할 파일/폴더 (먼저 설정)
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '*.js',  // 모든 JS 파일 무시 (설정 파일 포함)
      'test/**',  // test 디렉토리는 별도 tsconfig가 필요하므로 일단 제외
    ],
  },

  // ESLint 기본 추천 규칙
  eslint.configs.recommended,

  // TypeScript ESLint 추천 규칙
  ...tseslint.configs.recommended,

  // Prettier와 충돌하는 규칙 비활성화
  prettier,

  {
    // 린트 대상 파일 지정 (src 디렉토리만)
    files: ['src/**/*.ts'],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },

    rules: {
      // 커스텀 규칙 설정
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  }
);