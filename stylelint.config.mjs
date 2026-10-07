/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['dist/**'],
  rules: {
    'import-notation': null,
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'theme',
          'custom-variant',
          'apply',
          'layer',
          'config',
          'plugin',
          'source',
          'utility',
          'variant',
          'reference',
        ],
      },
    ],
    'at-rule-prelude-no-invalid': null,
  },
}
