import type Parser from './index.ts'
import type {
  BooleanLiteral,
  Expression,
  Identifier,
  IntegerLiteral,
  Literal,
  StringLiteral
} from './index.ts'
import { TokenType, type Token } from './token.ts'

export const PRECEDENCE: Record<
  | TokenType.PLUS
  | TokenType.MINUS
  | TokenType.SLASH
  | TokenType.ASTERISK
  | TokenType.LPAREN
  | TokenType.RPAREN,
  number
> = {
  [TokenType.PLUS]: 1,
  [TokenType.MINUS]: 1,
  [TokenType.SLASH]: 2,
  [TokenType.ASTERISK]: 2,
  [TokenType.LPAREN]: 3,
  [TokenType.RPAREN]: 3
}

export function getPrecedence(token: Token): number {
  if (token.type in PRECEDENCE) {
    return PRECEDENCE[token.type as keyof typeof PRECEDENCE]
  }
  return 0
}

export function parseTokenAsLiteral(token: Token): Literal['value'] | null {
  switch (token.type) {
    case TokenType.INT:
      return parseInteger({ type: 'IntegerLiteral', value: parseInt(token.literal, 10), token })
    case TokenType.STRING:
      return parseString({ type: 'StringLiteral', value: token.literal, token })
    case TokenType.TRUE:
      return parseBoolean({ type: 'BooleanLiteral', value: true, token })
    case TokenType.FALSE:
      return parseBoolean({ type: 'BooleanLiteral', value: false, token })
    default:
      return null
  }
}

export function parseIdentifier(node: Identifier): string {
  return node.value
}

export function parseInteger(node: IntegerLiteral): number {
  return node.value
}

export function parseString(node: StringLiteral): string {
  return `"${node.value}"`
}

export function parseBoolean(node: BooleanLiteral): string {
  return node.value ? 'true' : 'false'
}

export function isStringCompatible(expr: Expression, identifiers: Parser['identifiers']): boolean {
  if (expr.type === 'StringLiteral') return true
  if (expr.type === 'InfixExpression') {
    return isStringCompatible(expr.left, identifiers) && isStringCompatible(expr.right, identifiers)
  }
  if (expr.type === 'Identifier') {
    const identifier = identifiers[expr.value]
    return isStringCompatible(identifier, identifiers)
  }
  return false
}
