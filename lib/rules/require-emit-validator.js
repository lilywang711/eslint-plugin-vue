/**
 * @fileoverview Emit definitions should be detailed
 * @author Pig Fang
 */
'use strict'

const utils = require('../utils')

/**
 * @typedef {import('../utils').ComponentArrayEmit} ComponentArrayEmit
 * @typedef {import('../utils').ComponentObjectEmit} ComponentObjectEmit
 * @typedef {import('../utils').ComponentTypeEmit} ComponentTypeEmit
 */

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

module.exports = {
  meta: {
    hasSuggestions: true,
    type: 'suggestion',
    docs: {
      description: 'require type definitions in emits',
      categories: undefined,
      url: 'https://eslint.vuejs.org/rules/require-emit-validator.html'
    },
    fixable: null,
    messages: {
      missing: 'Emit "{{name}}" should define at least its validator function.',
      skipped:
        'Emit "{{name}}" should not skip validation, or you may define a validator function with no parameters.',
      emptyValidation: 'Replace with a validator function with no parameters.'
    },
    schema: []
  },
  /** @param {RuleContext} context */
  create(context) {
    // ----------------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------------

    /**
     * @param {ComponentArrayEmit|ComponentObjectEmit} emit
     */
    function checker({ value, node, emitName }) {
      const hasType =
        !!value &&
        (value.type === 'ArrowFunctionExpression' ||
          value.type === 'FunctionExpression' ||
          // validator may from outer scope
          value.type === 'Identifier')

      if (!hasType) {
        const name =
          emitName ||
          (node.type === 'Identifier' && node.name) ||
          'Unknown emit'

        if (value && value.type === 'Literal' && value.value === null) {
          context.report({
            node,
            messageId: 'skipped',
            data: { name },
            suggest: [
              {
                messageId: 'emptyValidation',
                fix: (fixer) => fixer.replaceText(value, '() => true')
              }
            ]
          })

          return
        }

        context.report({
          node,
          messageId: 'missing',
          data: { name }
        })
      }
    }

    // ----------------------------------------------------------------------
    // Public
    // ----------------------------------------------------------------------

    return utils.compositingVisitors(
      utils.executeOnVue(context, (obj) => {
        utils.getComponentEmits(obj).forEach(checker)
      }),
      utils.defineScriptSetupVisitor(context, {
        onDefineEmitsEnter(_node, emits) {
          for (const emit of emits) {
            if (emit.type === 'type') {
              continue
            }
            checker(emit)
          }
        }
      })
    )
  }
}
