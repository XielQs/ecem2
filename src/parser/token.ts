export enum TokenType {
  ILLEGAL = 'illegal',
  END_OF_FILE = 'EOF',
  NEWLINE = 'newline',

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
  ELSE = 'else',
  RETURN = 'return',
  WHILE = 'while',
  IMPORT = 'import'
}

export interface Token {
  type: TokenType
  literal: string
  line: number
  column: number
}
