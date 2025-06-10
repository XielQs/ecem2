import type { Token } from './token.ts'

export type ASTNode = Program | Statement | Literal | Identifier

export interface BaseNode {
  type: string
  token: Token
}

export interface Program {
  type: 'Program'
  body: Statement[]
}

// ---------------- Literals ----------------

export interface Identifier extends BaseNode {
  type: 'Identifier'
  value: string
}

export interface IntegerLiteral extends BaseNode {
  type: 'IntegerLiteral'
  value: number
}

export interface StringLiteral extends BaseNode {
  type: 'StringLiteral'
  value: string
}

export interface BooleanLiteral extends BaseNode {
  type: 'BooleanLiteral'
  value: boolean
}

export type Literal = IntegerLiteral | StringLiteral | BooleanLiteral | Identifier

// ---------------- Statements ----------------

export interface LetStatement {
  type: 'LetStatement'
  name: Identifier
  value: Literal
}

export interface ExpressionStatement {
  type: 'ExpressionStatement'
  expression: ASTNode
}

export type Statement = LetStatement
