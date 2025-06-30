'use strict';

module.exports = {
  require: ['@babel/register'],
  file: ['tests/setup.js'],
  recursive: true,
  timeout: 5000,
  exit: true,
  spec: ['tests/**/*.spec.js'],
  ignore: ['node_modules/**'],
};
