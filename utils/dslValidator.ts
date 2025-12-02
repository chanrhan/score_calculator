// Simple DSL validation utility for block expressions
export interface DSLValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Basic DSL syntax patterns
const DSL_PATTERNS = {
  // Variable references: ${variable} or variable.property
  variableRef: /\$\{[a-zA-Z_][a-zA-Z0-9_.]*\}|[a-zA-Z_][a-zA-Z0-9_.]*\.[a-zA-Z_][a-zA-Z0-9_.]*|[a-zA-Z_][a-zA-Z0-9_]*$/,
  
  // Operators
  operator: /[+\-*\/=<>!&|]+/,
  
  // Numbers
  number: /\d+(?:\.\d+)?/,
  
  // Parentheses
  parentheses: /[()]/,
  
  // Common DSL keywords
  keywords: /\b(subjects?|score|final|length|count|sum|avg|min|max|filter|where|and|or|not|if|then|else|true|false)\b/i,
}

export function validateDSL(expression: string, context: 'condition' | 'variable' | 'formula' = 'formula'): DSLValidationResult {
  const result: DSLValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  }

  if (!expression.trim()) {
    result.errors.push('표현식이 비어있습니다')
    result.isValid = false
    return result
  }

  // Basic syntax validation
  const tokens = tokenize(expression)
  
  // Check for balanced parentheses
  if (!hasBalancedParentheses(expression)) {
    result.errors.push('괄호가 균형을 이루지 않습니다')
    result.isValid = false
  }

  // Check for common syntax errors
  if (hasConsecutiveOperators(tokens)) {
    result.errors.push('연속된 연산자가 있습니다')
    result.isValid = false
  }

  // Context-specific validation
  if (context === 'condition') {
    if (!hasComparisonOrLogical(tokens)) {
      result.warnings.push('조건식에는 비교 연산자(>, <, ==) 또는 논리 연산자(&&, ||)가 포함되어야 합니다')
    }
  }

  // Check for potentially undefined variables
  const variables = extractVariables(tokens)
  const commonVariables = ['subjects', 'subject', 'score', 'final', 'current', 'context']
  variables.forEach(variable => {
    if (!commonVariables.some(common => variable.includes(common))) {
      result.warnings.push(`변수 '${variable}'가 정의되지 않을 수 있습니다`)
    }
  })

  return result
}

function tokenize(expression: string): string[] {
  // Simple tokenization - split by whitespace and common operators
  return expression
    .replace(/([+\-*\/=<>!&|(){}])/g, ' $1 ')
    .split(/\s+/)
    .filter(token => token.trim().length > 0)
}

function hasBalancedParentheses(expression: string): boolean {
  let count = 0
  for (const char of expression) {
    if (char === '(') count++
    else if (char === ')') count--
    if (count < 0) return false
  }
  return count === 0
}

function hasConsecutiveOperators(tokens: string[]): boolean {
  const operators = ['+', '-', '*', '/', '=', '==', '<', '>', '<=', '>=', '!=', '&&', '||']
  for (let i = 0; i < tokens.length - 1; i++) {
    if (operators.includes(tokens[i]) && operators.includes(tokens[i + 1])) {
      return true
    }
  }
  return false
}

function hasComparisonOrLogical(tokens: string[]): boolean {
  const comparisonOperators = ['>', '<', '>=', '<=', '==', '!=', '&&', '||']
  return tokens.some(token => comparisonOperators.includes(token))
}

function extractVariables(tokens: string[]): string[] {
  const variables: string[] = []
  const variablePattern = /^[a-zA-Z_][a-zA-Z0-9_.]*$/
  
  tokens.forEach(token => {
    if (variablePattern.test(token) && !['true', 'false', 'and', 'or', 'not', 'if', 'then', 'else'].includes(token.toLowerCase())) {
      variables.push(token)
    }
  })
  
  return [...new Set(variables)] // Remove duplicates
}

export default validateDSL