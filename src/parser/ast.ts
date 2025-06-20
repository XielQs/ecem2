import type { STDModule } from '../generator/modules.ts'
import type { Token } from './token.ts'

export type ASTNode = Program | Statement | Expression

export interface BaseNode {
  type: string
  token: Token
  cType: CType
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

export interface VoidLiteral extends BaseNode {
  type: 'VoidLiteral'
  value: undefined
  cType: 'VoidLiteral'
}

export type Literal = IntegerLiteral | StringLiteral | BooleanLiteral | VoidLiteral | Identifier

export type CType = 'IntegerLiteral' | 'StringLiteral' | 'BooleanLiteral' | 'VoidLiteral' | null

// ---------------- Statements ----------------

export interface LetStatement<V extends Expression = Expression> {
  type: 'LetStatement'
  name: Identifier
  value: V
}

export interface ExpressionStatement extends BaseNode {
  type: 'ExpressionStatement'
  expression: ASTNode
}

export interface AssignmentStatement {
  type: 'AssignmentStatement'
  name: Identifier
  value: Expression
}

export interface ImportStatement {
  type: 'ImportStatement'
  name: STDModule
  token: Token
}

export type Statement = LetStatement | ExpressionStatement | AssignmentStatement | ImportStatement

// ---------------- Expressions ----------------

export interface InfixExpression<L extends Expression = Expression, R extends Expression = L>
  extends BaseNode {
  type: 'InfixExpression'
  left: L
  operator: string
  right: R
}

export interface CallExpression<A extends Expression = Expression> extends BaseNode {
  type: 'CallExpression'
  callee: Identifier
  args: A[]
}

export interface MemberExpression {
  type: 'MemberExpression'
  object: Expression
  property: Identifier
  token: Token
  cType: CType
}

export interface MethodCallExpression {
  type: 'MethodCallExpression'
  callee: MemberExpression
  args: Expression[]
  token: Token
  cType: CType
}

export type Expression =
  | Literal
  | InfixExpression
  | CallExpression
  | MemberExpression
  | MethodCallExpression
