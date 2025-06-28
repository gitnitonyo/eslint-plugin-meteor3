/**
 * Rule to prevent using synchronous methods on the server in Meteor 3
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent using synchronous methods on the server in Meteor 3',
      category: 'Meteor',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      noSyncMethodsServer: 'Avoid using synchronous {{ method }} on the server. Use {{ asyncMethod }} instead',
    },
  },
  create(context) {
    // Map of sync methods to their async equivalents
    const syncToAsyncMap = {
      // Collection methods
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
      // User methods
      'user': 'userAsync',
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
      CallExpression(node) {
        // Only apply to server code
        if (!isServerCode(context.getFilename())) {
          return;
        }

        // Check if it's a method call on an object
        if (node.callee.type === 'MemberExpression') {
          const methodName = node.callee.property.name;
          
          // If this method has an async equivalent
          if (syncToAsyncMap[methodName]) {
            let objectName = '';
            
            // Handle Meteor.call and similar cases
            if (node.callee.object.type === 'MemberExpression' && 
                node.callee.object.object.name === 'Meteor' && 
                methodName === 'call') {
              objectName = 'Meteor';
              context.report({
                node,
                messageId: 'noSyncMethodsServer',
                data: {
                  method: `${objectName}.${methodName}`,
                  asyncMethod: `${objectName}.${syncToAsyncMap[methodName]}`,
                },
                fix(fixer) {
                  return fixer.replaceText(node.callee.property, syncToAsyncMap[methodName]);
                },
              });
            } 
            // Handle Meteor.user
            else if (node.callee.object.name === 'Meteor' && methodName === 'user') {
              objectName = 'Meteor';
              context.report({
                node,
                messageId: 'noSyncMethodsServer',
                data: {
                  method: `${objectName}.${methodName}`,
                  asyncMethod: `${objectName}.${syncToAsyncMap[methodName]}`,
                },
                fix(fixer) {
                  return fixer.replaceText(node.callee.property, syncToAsyncMap[methodName]);
                },
              });
            }
            // Handle Accounts methods
            else if (node.callee.object.type === 'MemberExpression' && 
                    node.callee.object.object.name === 'Accounts' && 
                    syncToAsyncMap[methodName]) {
              objectName = 'Accounts';
              context.report({
                node,
                messageId: 'noSyncMethodsServer',
                data: {
                  method: `${objectName}.${methodName}`,
                  asyncMethod: `${objectName}.${syncToAsyncMap[methodName]}`,
                },
                fix(fixer) {
                  return fixer.replaceText(node.callee.property, syncToAsyncMap[methodName]);
                },
              });
            }
            // Handle collection methods
            else if (['findOne', 'insert', 'update', 'remove', 'upsert', 'createIndex'].includes(methodName)) {
              // Try to get the collection name if possible
              let collectionName = 'Collection';
              if (node.callee.object.type === 'Identifier') {
                collectionName = node.callee.object.name;
              }
              
              context.report({
                node,
                messageId: 'noSyncMethodsServer',
                data: {
                  method: `${collectionName}.${methodName}`,
                  asyncMethod: `${collectionName}.${syncToAsyncMap[methodName]}`,
                },
                fix(fixer) {
                  return fixer.replaceText(node.callee.property, syncToAsyncMap[methodName]);
                },
              });
            }
            // Handle cursor methods
            else if (['forEach', 'map', 'fetch', 'count', 'observe', 'observeChanges'].includes(methodName)) {
              context.report({
                node,
                messageId: 'noSyncMethodsServer',
                data: {
                  method: `cursor.${methodName}`,
                  asyncMethod: `cursor.${syncToAsyncMap[methodName]}`,
                },
                fix(fixer) {
                  return fixer.replaceText(node.callee.property, syncToAsyncMap[methodName]);
                },
              });
            }
          }
        }
      },
    };
  },
};
