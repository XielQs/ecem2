import type {
  BooleanLiteral,
  CType,
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
  | TokenType.RPAREN
  | TokenType.AND
  | TokenType.OR,
  number
> = {
  [TokenType.OR]: 1,
  [TokenType.AND]: 2,
  [TokenType.PLUS]: 3,
  [TokenType.MINUS]: 3,
  [TokenType.SLASH]: 4,
  [TokenType.ASTERISK]: 4,
  [TokenType.LPAREN]: 5,
  [TokenType.RPAREN]: 5
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
      return parseInteger({
        type: 'IntegerLiteral',
        value: parseInt(token.literal, 10),
        token,
        cType: 'IntegerLiteral'
      })
    case TokenType.STRING:
      return parseString({
        type: 'StringLiteral',
        value: token.literal,
        token,
        cType: 'StringLiteral'
      })
    case TokenType.TRUE:
      return parseBoolean({ type: 'BooleanLiteral', value: true, token, cType: 'BooleanLiteral' })
    case TokenType.FALSE:
      return parseBoolean({ type: 'BooleanLiteral', value: false, token, cType: 'BooleanLiteral' })
    default:
      return null
  }
}

export function CTypeToHuman(cType: CType | null): string {
  switch (cType) {
    case 'IntegerLiteral':
      return 'integer'
    case 'StringLiteral':
      return 'string'
    case 'BooleanLiteral':
      return 'boolean'
    case 'VoidLiteral':
      return 'void'
    default:
      return cType ?? 'unknown'
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

export function parseVoid(): string {
  return 'void'
}
