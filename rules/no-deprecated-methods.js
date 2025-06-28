/**
 * Rule to prevent using deprecated methods in Meteor 3
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent using deprecated methods in Meteor 3',
      category: 'Meteor',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      noDeprecatedMethods: '{{ method }} is deprecated in Meteor 3. Use {{ alternative }} instead',
      noDeprecatedMethodsNoAlt: '{{ method }} is deprecated in Meteor 3 and should not be used',
    },
  },
  create(context) {
    // Map of deprecated methods to their alternatives
    const deprecatedMethodsMap = {
      // Meteor core
      'Meteor.wrapAsync': 'Promise-based APIs or util.promisify',
      'Meteor.bindEnvironment': 'async/await with Meteor.EnvironmentVariable',
      'Meteor._noYieldsAllowed': 'Meteor.EnvironmentVariable',
      'Meteor._sleepForMs': 'setTimeout with Promise',
      
      // DDP
      'DDP._CurrentMethodInvocation': 'Meteor.EnvironmentVariable',
      'DDP._CurrentPublicationInvocation': 'Meteor.EnvironmentVariable',
      
      // Accounts
      'Accounts.onLogin': 'Accounts.onLoginAsync',
      'Accounts.validateLoginAttempt': 'Accounts.validateLoginAttemptAsync',
      'Accounts.onCreateUser': 'Accounts.onCreateUserAsync',
      
      // Publications
      'Meteor.publish': 'Meteor.publishAsync',
      
      // HTTP
      'HTTP.call': 'fetch API',
      'HTTP.get': 'fetch API',
      'HTTP.post': 'fetch API',
      'HTTP.put': 'fetch API',
      'HTTP.del': 'fetch API',
      
      // Email
      'Email.send': 'Email.sendAsync',
      
      // Deprecated patterns without direct replacements
      'Meteor.isClient': 'import { isClient } from "meteor/meteor"',
      'Meteor.isServer': 'import { isServer } from "meteor/meteor"',
      'Meteor.isCordova': 'import { isCordova } from "meteor/meteor"',
    };
    
    // Methods that are completely removed with no direct replacement
    const removedMethods = [
      'Meteor.setTimeout',
      'Meteor.setInterval',
      'Meteor.clearTimeout',
      'Meteor.clearInterval',
      'Meteor._debug',
      'Meteor._setImmediate',
    ];

    return {
      MemberExpression(node) {
        // Skip if not a property access
        if (node.computed) return;
        
        // Check for deprecated methods
        if (node.object.type === 'Identifier') {
          const objectName = node.object.name;
          const propertyName = node.property.name;
          const fullName = `${objectName}.${propertyName}`;
          
          // Check if it's a deprecated method
          if (deprecatedMethodsMap[fullName]) {
            context.report({
              node,
              messageId: 'noDeprecatedMethods',
              data: {
                method: fullName,
                alternative: deprecatedMethodsMap[fullName],
              },
            });
          }
          
          // Check if it's a removed method
          if (removedMethods.includes(fullName)) {
            context.report({
              node,
              messageId: 'noDeprecatedMethodsNoAlt',
              data: {
                method: fullName,
              },
            });
          }
        }
        
        // Check for Meteor.publish specifically (common usage pattern)
        if (node.object.name === 'Meteor' && 
            node.property.name === 'publish' && 
            node.parent.type === 'CallExpression') {
          context.report({
            node,
            messageId: 'noDeprecatedMethods',
            data: {
              method: 'Meteor.publish',
              alternative: 'Meteor.publishAsync',
            },
            fix(fixer) {
              return fixer.replaceText(node.property, 'publishAsync');
            },
          });
        }
      },
      
      // Check for HTTP package methods
      CallExpression(node) {
        if (node.callee.type === 'MemberExpression' && 
            node.callee.object.name === 'HTTP') {
          const methodName = node.callee.property.name;
          
          if (['call', 'get', 'post', 'put', 'del'].includes(methodName)) {
            context.report({
              node,
              messageId: 'noDeprecatedMethods',
              data: {
                method: `HTTP.${methodName}`,
                alternative: 'fetch API',
              },
            });
          }
        }
        
        // Check for Email.send
        if (node.callee.type === 'MemberExpression' && 
            node.callee.object.name === 'Email' && 
            node.callee.property.name === 'send') {
          context.report({
            node,
            messageId: 'noDeprecatedMethods',
            data: {
              method: 'Email.send',
              alternative: 'Email.sendAsync',
            },
            fix(fixer) {
              return fixer.replaceText(node.callee.property, 'sendAsync');
            },
          });
        }
      },
    };
  },
};
