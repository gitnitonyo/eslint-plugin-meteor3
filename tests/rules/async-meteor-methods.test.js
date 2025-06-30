'use strict';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require('../../rules/async-meteor-methods');
const { RuleTester } = require('eslint');

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

ruleTester.run('async-meteor-methods', rule, {
  valid: [
    // Basic async method
    `Meteor.methods({
      async myMethod() {}
    });`,

    // Async arrow function
    `Meteor.methods({
      myMethod: async () => {}
    });`,

    // Async function expression
    `Meteor.methods({
      myMethod: async function() {}
    });`,


    // Ignored method pattern
    {
      code: `Meteor.methods({
        syncMethod() {}
      });`,
      options: [{ ignorePatterns: ['syncMethod'] }],
    },

    // Ignore getters/setters
    `Meteor.methods({
      get value() { return this._value; },
      set value(v) { this._value = v; }
    });`,

    // Non-method properties
    `Meteor.methods({
      prop: 'value',
      [computed]: 'value'
    });`,
  ],

  invalid: [
    // Regular method
    {
      code: `Meteor.methods({
        myMethod() {}
      });`,
      output: `Meteor.methods({
        async myMethod() {}
      });`,
      errors: [{ messageId: 'useAsyncMethodsWithName', data: { methodName: 'myMethod' } }],
    },

    // Arrow function
    {
      code: `Meteor.methods({
        myMethod: () => {}
      });`,
      output: `Meteor.methods({
        myMethod: (async ) => {}
      });`,
      errors: [{ messageId: 'useAsyncMethodsWithName', data: { methodName: 'myMethod' } }],
    },

    // Function expression
    {
      code: `Meteor.methods({
        myMethod: function() {}
      });`,
      output: `Meteor.methods({
        myMethod: async function() {}
      });`,
      errors: [{ messageId: 'useAsyncMethodsWithName', data: { methodName: 'myMethod' } }],
    },

    // Multiple methods
    {
      code: `Meteor.methods({
        method1() {},
        method2: () => {}
      });`,
      output: `Meteor.methods({
        async method1() {},
        method2: (async ) => {}
      });`,
      errors: [
        { messageId: 'useAsyncMethodsWithName', data: { methodName: 'method1' } },
        { messageId: 'useAsyncMethodsWithName', data: { methodName: 'method2' } },
      ],
    },
  ],
});
