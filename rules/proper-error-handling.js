/**
 * Rule to enforce proper error handling for async operations in Meteor 3
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce proper error handling for async operations in Meteor 3',
      category: 'Meteor',
      recommended: true,
    },
    schema: [],
    messages: {
      useTryCatch: 'Use try/catch blocks for error handling with async operations',
      noUnhandledPromises: 'Unhandled promise rejection: Add await and try/catch to handle potential errors',
    },
  },
  create(context) {
    // List of Meteor async methods that should be handled
    const asyncMethods = [
      'callAsync',
      'applyAsync',
      'userAsync',
      'findOneAsync',
      'insertAsync',
      'updateAsync',
      'removeAsync',
      'upsertAsync',
      'createIndexAsync',
      'forEachAsync',
      'mapAsync',
      'fetchAsync',
      'countAsync',
      'observeAsync',
      'observeChangesAsync',
      'createUserAsync',
      'setPasswordAsync',
      'addEmailAsync',
      'replaceEmailAsync',
    ];

    return {
      // Check for await expressions without try/catch
      AwaitExpression(node) {
        // Check if the await expression is inside a try block
        let isInsideTry = false;
        let parent = node.parent;
        
        while (parent) {
          if (parent.type === 'TryStatement') {
            isInsideTry = true;
            break;
          }
          parent = parent.parent;
        }
        
        // If it's an async method call and not inside a try block, report it
        if (!isInsideTry && 
            node.argument.type === 'CallExpression' && 
            node.argument.callee.type === 'MemberExpression') {
          
          const methodName = node.argument.callee.property.name;
          
          if (asyncMethods.includes(methodName)) {
            context.report({
              node,
              messageId: 'useTryCatch',
            });
          }
        }
      },
      
      // Check for async method calls without await
      CallExpression(node) {
        // Skip if the call is already awaited or in a promise chain
        if (node.parent.type === 'AwaitExpression' || 
            (node.parent.type === 'MemberExpression' && 
             (node.parent.property.name === 'then' || 
              node.parent.property.name === 'catch'))) {
          return;
        }
        
        // Check if it's an async method call
        if (node.callee.type === 'MemberExpression') {
          const methodName = node.callee.property.name;
          
          if (asyncMethods.includes(methodName)) {
            // Check if we're inside an async function
            let isInsideAsyncFunction = false;
            let parent = node.parent;
            
            while (parent) {
              if ((parent.type === 'FunctionDeclaration' || 
                   parent.type === 'FunctionExpression' || 
                   parent.type === 'ArrowFunctionExpression') && 
                  parent.async) {
                isInsideAsyncFunction = true;
                break;
              }
              parent = parent.parent;
            }
            
            // Only report if we're inside an async function (where await is possible)
            if (isInsideAsyncFunction) {
              context.report({
                node,
                messageId: 'noUnhandledPromises',
              });
            }
          }
        }
      },
    };
  },
};
