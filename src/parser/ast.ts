import type { Token } from './token.ts'

export type ASTNode = Program | Statement | Expression

export interface BaseNode {
  type: string
  token: Token
  cType: CType | null
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
  cType: 'IntegerLiteral'
}

export interface StringLiteral extends BaseNode {
  type: 'StringLiteral'
  value: string
  cType: 'StringLiteral'
}

export interface BooleanLiteral extends BaseNode {
  type: 'BooleanLiteral'
  value: boolean
  cType: 'BooleanLiteral'
}

export type Literal = IntegerLiteral | StringLiteral | BooleanLiteral | Identifier

export type CType = Exclude<Literal['type'], 'Identifier'>

// ---------------- Statements ----------------

export interface LetStatement<V extends Expression = Expression> {
  type: 'LetStatement'
  name: Identifier
  value: V
}

export interface ExpressionStatement {
  type: 'ExpressionStatement'
  expression: ASTNode
}

export interface AssignmentStatement {
  type: 'AssignmentStatement'
  name: Identifier
  value: Expression
}

export type Statement = LetStatement | ExpressionStatement | AssignmentStatement

// ---------------- Expressions ----------------

export interface InfixExpression<L extends Expression = Expression, R extends Expression = L>
  extends BaseNode {
  type: 'InfixExpression'
  left: L
  operator: string
  right: R
}

export type Expression = Literal | InfixExpression
