module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['react', '@typescript-eslint'],
  extends: [
    'standard',
    'prettier',
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended'
  ],

  rules: {
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-explicit-any': ['off'],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    // 禁用react的依赖检查
    'react-hooks/rules-of-hooks': 'off',
    'react-hooks/exhaustive-deps': 'off'
  }
}
