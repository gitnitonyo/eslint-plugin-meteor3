/**
 * Rule to enforce async Meteor methods in Meteor 3
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce using async for Meteor methods in Meteor 3',
      category: 'Meteor',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      useAsyncMethods: 'Meteor methods should be declared as async functions in Meteor 3',
    },
  },
  create(context) {
    return {
      // Check for Meteor.methods calls
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'Meteor' &&
          node.callee.property.name === 'methods'
        ) {
          // Methods should have one argument that is an object
          if (node.arguments.length === 1 && node.arguments[0].type === 'ObjectExpression') {
            const methodsObj = node.arguments[0];

            // Check each method in the object
            methodsObj.properties.forEach((prop) => {
              // Skip if not a method or already async
              if (
                prop.type !== 'Property' ||
                (prop.value.type === 'FunctionExpression' && prop.value.async) ||
                (prop.value.type === 'ArrowFunctionExpression' && prop.value.async)
              ) {
                return;
              }

              // Report if method is not async
              if (
                (prop.value.type === 'FunctionExpression' && !prop.value.async) ||
                (prop.value.type === 'ArrowFunctionExpression' && !prop.value.async)
              ) {
                context.report({
                  node: prop.value,
                  messageId: 'useAsyncMethods',
                  fix(fixer) {
                    // Get the range of the function keyword or the start of arrow function
                    let start;
                    if (prop.value.type === 'FunctionExpression') {
                      // For function expressions, insert before 'function'
                      start = prop.value.range[0];
                    } else {
                      // For arrow functions, insert at the beginning
                      start = prop.value.range[0];
                    }

                    return fixer.insertTextBefore(prop.value, 'async ');
                  },
                });
              }
            });
          }
        }
      },
    };
  },
};
