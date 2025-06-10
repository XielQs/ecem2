export enum TokenType {
  ILLEGAL = 'illegal',
  END_OF_FILE = 'EOF',

  IDENTIFIER = 'identifier',
  INT = 'integer',
  STRING = 'string',

  ASSIGN = '=',
  PLUS = '+',
  MINUS = '-',
  BANG = '!',
  ASTERISK = '*',
  SLASH = '/',
  EQ = '==',
  NOT_EQ = '!=',

  LT = '<',
  GT = '>',
  LT_EQ = '<=',
  GT_EQ = '>=',

  COMMA = '.',
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
  IF = 'if',
  ELSE = 'else',
  RETURN = 'return',
  WHILE = 'while'
}

export function tokenTypeToString(type: TokenType) {
  return (
    Object.keys(TokenType).find(key => TokenType[key as keyof typeof TokenType] === type) ||
    'UNKNOWN'
  )
}

export interface Token {
  type: TokenType
  literal: string
  line: number
  column: number
}
