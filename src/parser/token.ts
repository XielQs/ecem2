import type { CType } from './ast.ts'

export enum TokenType {
  ILLEGAL = 'illegal',
  END_OF_FILE = 'EOF',
  NEWLINE = 'newline',

  IDENTIFIER = 'identifier',
  INT = 'int',
  STRING = 'string',
  BOOLEAN = 'boolean',
  VOID = 'void',

  ASSIGN = '=',
  PLUS = '+',
  MINUS = '-',
  BANG = '!',
  ASTERISK = '*',
  SLASH = '/',
  EQ = '==',
  NOT_EQ = '!=',
  AND = '&&',
  OR = '||',
  AMPERSAND = '&',
  PIPE = '|',

  LT = '<',
  GT = '>',
  LT_EQ = '<=',
  GT_EQ = '>=',

  COMMA = ',',
  DOT = '.',
  SEMICOLON = ';',
  COLON = ':',

  LPAREN = '(',
  RPAREN = ')',
  LBRACE = '{',
  RBRACE = '}',

  FUNCTION = 'ft',
  LET = 'let',
  TRUE = 'true',
  FALSE = 'false',
  CHECK = 'check',
  FAIL = 'fail',
  RETURN = 'return',
  DURING = 'during',
  IMPORT = 'import'
}

export const primitiveTypes = {
  [TokenType.INT]: 'IntegerLiteral',
  [TokenType.STRING]: 'StringLiteral',
  [TokenType.BOOLEAN]: 'BooleanLiteral',
  [TokenType.VOID]: 'VoidLiteral'
} satisfies Record<string, CType>

export const isPrimitiveType = (type: string): type is keyof typeof primitiveTypes => {
  return Object.keys(primitiveTypes).includes(type)
}

export interface Token {
  type: TokenType
  literal: string
  line: number
  column: number
}
