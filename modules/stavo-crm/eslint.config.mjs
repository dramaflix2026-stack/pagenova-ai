import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'drizzle/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
    },
  },
  {
    files: ['src/client/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    languageOptions: { globals: globals.browser },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // O bundle do navegador nunca pode arrastar codigo (nem segredo) do servidor.
      // Testes rodam no Node e importam o servidor legitimamente.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@server/*', '**/server/*'],
              message:
                'Codigo do cliente nunca importa do servidor. Use @shared/* para contratos.',
            },
          ],
        },
      ],
    },
  },
  {
    // O design system e os hooks exportam helpers ao lado dos componentes de
    // proposito; Fast Refresh nao e criterio de qualidade aqui.
    files: ['src/client/components/ui/**', 'src/client/hooks/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['src/server/**/*.ts', 'scripts/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@client/*'], message: 'O servidor nao importa codigo de UI.' },
          ],
        },
      ],
    },
  },
  {
    // O site-kit precisa rodar no navegador (previa) e no servidor
    // (publicacao) com o mesmo resultado: nada de codigo de servidor ou de UI.
    files: ['src/site-kit/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          // `paths` casa o modulo EXATO; `patterns` casa por prefixo. A barrel
          // precisa do primeiro, senao todo import interno seria recusado.
          paths: [
            {
              name: '@site-kit',
              message:
                'Dentro do site-kit, importe o caminho direto (@site-kit/themes/fonts). ' +
                'Importar a barrel de dentro dela fecha um ciclo que so quebra em producao.',
            },
            {
              name: '@site-kit/index',
              message: 'Importe o caminho direto do modulo, nunca a barrel, de dentro do site-kit.',
            },
          ],
          patterns: [
            {
              group: ['@server/*', '@client/*', '@builder/*'],
              message:
                'O site-kit e isomorfico: nao conhece servidor, UI do CRM nem o builder. ' +
                'A dependencia corre no sentido contrario.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}', '**/*.config.{ts,js,mjs}', 'scripts/**/*.{ts,mjs}'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-console': 'off',
      // Scripts de build/teste rodam no Node com globals proprios.
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
