/**
 * Rule to prefer async methods in Meteor 3
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce using async methods in Meteor 3',
      category: 'Meteor',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferAsync: 'Use {{ asyncMethod }} instead of {{ method }} for better performance and compatibility with Meteor 3',
    },
  },
  create(context) {
    // Map of sync methods to their async equivalents
    const asyncMethodMap = {
      // Collection methods
      'find': 'find', // find itself doesn't have an async version, but its operations do
      'findOne': 'findOneAsync',
      'insert': 'insertAsync',
      'update': 'updateAsync',
      'remove': 'removeAsync',
      'upsert': 'upsertAsync',
      'createIndex': 'createIndexAsync',
      // Cursor methods
      'forEach': 'forEachAsync',
      'map': 'mapAsync',
      'fetch': 'fetchAsync',
      'count': 'countAsync',
      'observe': 'observeAsync',
      'observeChanges': 'observeChangesAsync',
      // Meteor methods
      'call': 'callAsync',
      'apply': 'applyAsync',
      // Accounts methods
      'createUser': 'createUserAsync',
      'setPassword': 'setPasswordAsync',
      'addEmail': 'addEmailAsync',
      'replaceEmail': 'replaceEmailAsync',
    };

    // Check if we're in server code
    function isServerCode(filename) {
      return /\/server\/|\/imports\/api\//.test(filename);
    }

    return {
      // Check for collection method calls
      CallExpression(node) {
        // Skip if not in server code
        if (!isServerCode(context.getFilename())) {
          return;
        }

        // Check if it's a method call on an object
        if (node.callee.type === 'MemberExpression') {
          const methodName = node.callee.property.name;
          
          // If this method has an async equivalent
          if (asyncMethodMap[methodName]) {
            // Meteor.call is a special case
            if (methodName === 'call' && 
                node.callee.object.type === 'MemberExpression' && 
                node.callee.object.object.name === 'Meteor') {
              context.report({
                node,
                messageId: 'preferAsync',
                data: {
                  method: 'Meteor.call',
                  asyncMethod: 'Meteor.callAsync',
                },
                fix(fixer) {
                  return fixer.replaceText(node.callee.property, 'callAsync');
                },
              });
            }
            // Meteor.apply is a special case
            else if (methodName === 'apply' && 
                    node.callee.object.type === 'MemberExpression' && 
                    node.callee.object.object.name === 'Meteor') {
              context.report({
                node,
                messageId: 'preferAsync',
                data: {
                  method: 'Meteor.apply',
                  asyncMethod: 'Meteor.applyAsync',
                },
                fix(fixer) {
                  return fixer.replaceText(node.callee.property, 'applyAsync');
                },
              });
            }
            // Regular collection methods
            else if (['findOne', 'insert', 'update', 'remove', 'upsert', 'createIndex'].includes(methodName)) {
              context.report({
                node,
                messageId: 'preferAsync',
                data: {
                  method: methodName,
                  asyncMethod: asyncMethodMap[methodName],
                },
                fix(fixer) {
                  return fixer.replaceText(node.callee.property, asyncMethodMap[methodName]);
                },
              });
            }
            // Cursor methods
            else if (['forEach', 'map', 'fetch', 'count', 'observe', 'observeChanges'].includes(methodName)) {
              context.report({
                node,
                messageId: 'preferAsync',
                data: {
                  method: methodName,
                  asyncMethod: asyncMethodMap[methodName],
                },
                fix(fixer) {
                  return fixer.replaceText(node.callee.property, asyncMethodMap[methodName]);
                },
              });
            }
            // Accounts methods
            else if (['createUser', 'setPassword', 'addEmail', 'replaceEmail'].includes(methodName) && 
                    node.callee.object.type === 'MemberExpression' && 
                    node.callee.object.object.name === 'Accounts') {
              context.report({
                node,
                messageId: 'preferAsync',
                data: {
                  method: `Accounts.${methodName}`,
                  asyncMethod: `Accounts.${asyncMethodMap[methodName]}`,
                },
                fix(fixer) {
                  return fixer.replaceText(node.callee.property, asyncMethodMap[methodName]);
                },
              });
            }
          }
          
          // Special case for Meteor.user()
          if (methodName === 'user' && 
              node.callee.object.name === 'Meteor' && 
              isServerCode(context.getFilename())) {
            context.report({
              node,
              messageId: 'preferAsync',
              data: {
                method: 'Meteor.user',
                asyncMethod: 'Meteor.userAsync',
              },
              fix(fixer) {
                return fixer.replaceText(node.callee.property, 'userAsync');
              },
            });
          }
        }
      },
    };
  },
};
