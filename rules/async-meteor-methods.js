/**
 * Rule to enforce async Meteor methods in Meteor 3
 * @type {import('eslint').Rule.RuleModule}
 */

/**
 * Checks if a node is a Meteor.methods() call
 * @param {import('estree').CallExpression} node - The call expression node
 * @returns {boolean}
 */
function isMeteorMethodsCall(node) {
  return (
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'Meteor' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'methods'
  );
}

/**
 * Checks if a node is a valid method definition
 * @param {import('estree').Node} node - The node to check
 * @returns {boolean}
 */
function isMethodDefinition(node) {
  return (
    // Regular method: { method() {} }
    (node.type === 'Property' && (
      node.value?.type === 'FunctionExpression' ||
      node.value?.type === 'ArrowFunctionExpression' ||
      node.value?.type === 'FunctionDeclaration'
    )) ||
    // Method shorthand: { method() {} }
    node.type === 'MethodDefinition' ||
    // Computed property names: { [methodName]() {} }
    (node.type === 'Property' && node.computed)
  );
}

/**
 * Checks if a method should be async
 * @param {import('estree').Node} node - The method node to check
 * @returns {boolean}
 */
function shouldMethodBeAsync(node) {
  const methodNode = node.value || node;
  // Skip if already async
  if (methodNode.async) return false;
  // Skip getters/setters
  if (node.kind === 'get' || node.kind === 'set') return false;
  // Skip if not a function
  if (!['FunctionExpression', 'ArrowFunctionExpression', 'FunctionDeclaration'].includes(methodNode.type)) {
    return false;
  }
  return true;
}

/**
 * Gets the fix range for a method node
 * @param {import('estree').Node} node - The method node
 * @returns {import('eslint').AST.Range}
 */
function getMethodFixRange(node) {
  const methodNode = node.value || node;
  // For async/await functions, insert before the 'function' keyword or parameters
  if (methodNode.type === 'FunctionExpression' || methodNode.type === 'FunctionDeclaration') {
    return [methodNode.range[0], methodNode.range[0] + 'function'.length];
  }
  // For arrow functions, insert at the start of the node
  return methodNode.range;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce using async for Meteor methods in Meteor 3',
      category: 'Meteor',
      recommended: true,
    },
    fixable: 'code',
    schema: [{
      type: 'object',
      properties: {
        ignorePatterns: {
          type: 'array',
          items: { type: 'string' },
          default: [],
        },
      },
      additionalProperties: false,
    }],
    messages: {
      useAsyncMethods: 'Meteor methods should be declared as async functions in Meteor 3',
      useAsyncMethodsWithName: 'Meteor method "{{methodName}}" should be declared as async in Meteor 3',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const ignorePatterns = options.ignorePatterns || [];

    /**
     * Checks if a method name matches any ignore patterns
     * @param {string} name - The method name to check
     * @returns {boolean}
     */
    function shouldIgnoreMethod(name) {
      return ignorePatterns.some(pattern => new RegExp(pattern).test(name));
    }

    /**
     * Processes a method definition node
     * @param {import('estree').Node} methodNode - The method node to process
     * @param {string} methodName - The name of the method
     * @param {import('eslint').Rule.Node} reportNode - The node to report the error on
     */
    function processMethod(methodNode, methodName, reportNode) {
      if (shouldIgnoreMethod(methodName)) {
        return;
      }

      context.report({
        node: reportNode,
        messageId: 'useAsyncMethodsWithName',
        data: {
          methodName,
        },
        fix(fixer) {
          const nodeToFix = methodNode.value || methodNode;
          const sourceCode = context.getSourceCode();
          
          // For method shorthand (e.g., `method() {}`)
          if (methodNode.method) {
            // Get all tokens for the property
            const tokens = sourceCode.getTokens(methodNode);
            // Find the method name token
            const methodNameToken = tokens.find(token => 
              token.type === 'Identifier' && token.value === methodName
            );
            
            if (methodNameToken) {
              // Insert 'async' before the method name
              return fixer.insertTextBefore(methodNameToken, 'async ');
            }
            // Fallback to inserting before the key if we can't find the exact token
            return fixer.insertTextBefore(methodNode.key, 'async ');
          }
          
          // For arrow functions
          if (nodeToFix.type === 'ArrowFunctionExpression') {
            // For property with arrow function: `method: () => {}`
            // Insert 'async' before the parameters
            const params = nodeToFix.params;
            const firstParam = params[0];
            const tokenBeforeParams = firstParam 
              ? sourceCode.getTokenBefore(firstParam) 
              : sourceCode.getFirstToken(nodeToFix, { skip: 1 }); // Skip the opening parenthesis
            
            if (tokenBeforeParams) {
              return fixer.insertTextBefore(tokenBeforeParams, 'async ');
            }
            // Fallback to inserting before the node
            return fixer.insertTextBefore(nodeToFix, 'async ');
          }
          
          // For function expressions
          if (nodeToFix.type === 'FunctionExpression') {
            return fixer.insertTextBefore(nodeToFix, 'async ');
          }
          
          // For function declarations
          if (nodeToFix.type === 'FunctionDeclaration') {
            return fixer.insertTextBefore(nodeToFix, 'async ');
          }
          
          // For class methods
          if (nodeToFix.type === 'MethodDefinition') {
            return fixer.insertTextBefore(nodeToFix.key, 'async ');
          }
          
          return null;
        },
      });
    }

    /**
     * Processes an object expression containing method definitions
     * @param {import('estree').ObjectExpression} obj - The object expression to process
     */
    function processMethodsObject(obj) {
      if (!obj.properties) return;

      obj.properties.forEach(prop => {
        // Skip if not a method or already async
        if (!isMethodDefinition(prop) || !shouldMethodBeAsync(prop)) {
          return;
        }

        // Get the method name
        let methodName = 'anonymous';
        if (prop.key) {
          if (prop.key.type === 'Identifier') {
            methodName = prop.key.name;
          } else if (prop.key.type === 'Literal') {
            methodName = String(prop.key.value);
          } else if (prop.key.type === 'TemplateLiteral' && 
                   prop.key.quasis.length === 1) {
            methodName = prop.key.quasis[0].value.cooked;
          }
        }

        processMethod(prop, methodName, prop.value || prop);
      });
    }

    return {
      // Handle direct Meteor.methods({ ... }) calls
      CallExpression(node) {
        if (!isMeteorMethodsCall(node) || node.arguments.length === 0) {
          return;
        }

        const methodsArg = node.arguments[0];
        
        // Handle direct object literal
        if (methodsArg.type === 'ObjectExpression') {
          processMethodsObject(methodsArg);
        }
        // Handle variable reference (e.g., const methods = { ... }; Meteor.methods(methods))
        else if (methodsArg.type === 'Identifier') {
          const variable = context.getScope().variables.find(
            v => v.name === methodsArg.name
          );

          if (variable) {
            variable.defs.forEach(def => {
              if (def.node?.init?.type === 'ObjectExpression') {
                processMethodsObject(def.node.init);
              }
            });
          }
        }
      },

      // Handle class-based method definitions
      ClassBody(node) {
        // Check if this is a class that's passed to Meteor.methods
        let parent = node.parent;
        while (parent) {
          if (parent.type === 'NewExpression' && 
              parent.callee.type === 'Identifier' &&
              parent.parent?.type === 'CallExpression' &&
              isMeteorMethodsCall(parent.parent)) {
            // Process class methods
            node.body.forEach(method => {
              if (method.type === 'MethodDefinition' && 
                  method.kind === 'method' &&
                  !method.static &&
                  !method.computed &&
                  method.key.type === 'Identifier' &&
                  !method.value.async) {
                processMethod(method, method.key.name, method);
              }
            });
            break;
          }
          parent = parent.parent;
        }
      },
    };
  },
};
