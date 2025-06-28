/**
 * Rule to enforce using Meteor.Error instead of generic Error in Meteor methods
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce using Meteor.Error instead of generic Error in Meteor methods',
      category: 'Meteor',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      useMeteorError: 'Use Meteor.Error instead of generic Error in Meteor methods for better client handling',
    },
  },
  create(context) {
    // Check if we're inside a Meteor method definition
    function isInsideMeteorMethod(node) {
      let current = node;
      let foundMethodsCall = false;
      let methodProperty = null;
      
      while (current && !foundMethodsCall) {
        // Check if we're in a property of an object passed to Meteor.methods
        if (current.type === 'Property' && current.parent && 
            current.parent.type === 'ObjectExpression') {
          methodProperty = current;
        }
        
        // Check if that object is passed to Meteor.methods
        if (current.type === 'CallExpression' && 
            current.callee.type === 'MemberExpression' &&
            current.callee.object.name === 'Meteor' &&
            current.callee.property.name === 'methods') {
          foundMethodsCall = true;
          break;
        }
        
        current = current.parent;
      }
      
      return foundMethodsCall ? methodProperty : null;
    }
    
    return {
      // Check for 'new Error()' expressions
      NewExpression(node) {
        // Only check for Error constructor
        if (node.callee.name !== 'Error') {
          return;
        }
        
        // Check if we're inside a Meteor method
        const methodProperty = isInsideMeteorMethod(node);
        if (methodProperty) {
          context.report({
            node,
            messageId: 'useMeteorError',
            fix(fixer) {
              return fixer.replaceText(node.callee, 'Meteor.Error');
            },
          });
        }
      },
      
      // Check for 'throw Error()' or 'throw new Error()' statements
      ThrowStatement(node) {
        // Check for throw Error(...)
        if (node.argument.type === 'CallExpression' && 
            node.argument.callee.name === 'Error') {
          
          // Check if we're inside a Meteor method
          const methodProperty = isInsideMeteorMethod(node);
          if (methodProperty) {
            context.report({
              node: node.argument,
              messageId: 'useMeteorError',
              fix(fixer) {
                return fixer.replaceText(node.argument.callee, 'Meteor.Error');
              },
            });
          }
        }
        
        // Check for throw new Error(...)
        if (node.argument.type === 'NewExpression' && 
            node.argument.callee.name === 'Error') {
          
          // Check if we're inside a Meteor method
          const methodProperty = isInsideMeteorMethod(node);
          if (methodProperty) {
            context.report({
              node: node.argument,
              messageId: 'useMeteorError',
              fix(fixer) {
                return fixer.replaceText(node.argument.callee, 'Meteor.Error');
              },
            });
          }
        }
      },
    };
  },
};
