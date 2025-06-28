/**
 * ESLint Plugin for Meteor 3 API
 * Enforces best practices for Meteor 3 development
 */

module.exports = {
  rules: {
    // Rule implementations
    'prefer-async-methods': require('./rules/prefer-async-methods'),
    'use-async-await': require('./rules/use-async-await'),
    'no-sync-methods-server': require('./rules/no-sync-methods-server'),
    'proper-error-handling': require('./rules/proper-error-handling'),
    'use-meteor-error': require('./rules/use-meteor-error'),
    'async-meteor-methods': require('./rules/async-meteor-methods'),
    'no-deprecated-methods': require('./rules/no-deprecated-methods'),
  },
  configs: {
    // Recommended configuration
    recommended: {
      plugins: ['meteor3'],
      rules: {
        'meteor3/prefer-async-methods': 'warn',
        'meteor3/use-async-await': 'warn',
        'meteor3/no-sync-methods-server': 'warn',
        'meteor3/proper-error-handling': 'warn',
        'meteor3/use-meteor-error': 'warn',
        'meteor3/async-meteor-methods': 'warn',
        'meteor3/no-deprecated-methods': 'error',
      },
    },
    // Strict configuration
    strict: {
      plugins: ['meteor3'],
      rules: {
        'meteor3/prefer-async-methods': 'error',
        'meteor3/use-async-await': 'error',
        'meteor3/no-sync-methods-server': 'error',
        'meteor3/proper-error-handling': 'error',
        'meteor3/use-meteor-error': 'error',
        'meteor3/async-meteor-methods': 'error',
        'meteor3/no-deprecated-methods': 'error',
      },
    },
  },
};
