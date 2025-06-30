'use strict';

// Configure Babel for ES modules support
require('@babel/register')({
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' }
    }]
  ],
  plugins: [
    '@babel/plugin-transform-modules-commonjs'
  ]
});
