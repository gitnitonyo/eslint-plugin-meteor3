/**
 * Rule to enforce using async/await with async methods in Meteor 3
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce using async/await with async methods in Meteor 3',
      category: 'Meteor',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      useAsyncAwait: 'Use async/await with {{ method }} instead of callbacks',
      noThenChaining: 'Use async/await instead of .then() chaining with {{ method }}',
    },
  },
  create(context) {
    // List of Meteor async methods
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
      // Check for callback usage with async methods
      CallExpression(node) {
        if (node.callee.type === 'MemberExpression') {
          const methodName = node.callee.property.name;
          
          // Check if this is an async method
          if (asyncMethods.includes(methodName)) {
            // Check if there's a callback argument (last argument is a function)
            const lastArg = node.arguments[node.arguments.length - 1];
            if (lastArg && 
                (lastArg.type === 'FunctionExpression' || 
                 lastArg.type === 'ArrowFunctionExpression')) {
              context.report({
                node,
                messageId: 'useAsyncAwait',
                data: {
                  method: methodName,
                },
              });
            }
          }
        }
      },
      
      // Check for .then() chaining instead of async/await
      MemberExpression(node) {
        if (node.property.name === 'then' && 
            node.object.type === 'CallExpression' &&
            node.object.callee.type === 'MemberExpression') {
          
          const methodName = node.object.callee.property.name;
          
          // Check if the method being chained is an async method
          if (asyncMethods.includes(methodName)) {
            context.report({
              node,
              messageId: 'noThenChaining',
              data: {
                method: methodName,
              },
            });
          }
        }
      },
    };
  },
};
