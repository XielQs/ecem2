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

export interface AssignmentStatement<V extends Expression = Expression> {
  type: 'AssignmentStatement'
  name: Identifier
  value: V
}

export interface ImportStatement {
  type: 'ImportStatement'
  name: STDModule
  token: Token
}

export interface BlockStatement {
  type: 'BlockStatement'
  statements: Statement[]
  token: Token
}

export interface CheckStatement<C extends Expression = Expression> {
  type: 'CheckStatement'
  condition: C
  body: BlockStatement
  fail: BlockStatement | null
  failCheck: CheckStatement<C> | null
  token: Token
}

export interface DuringStatement<C extends Expression = Expression> {
  type: 'DuringStatement'
  condition: C
  body: BlockStatement
  fail: BlockStatement | null
  token: Token
}

export interface FunctionStatement {
  type: 'FunctionStatement'
  name: Identifier
  args: Identifier[]
  body: BlockStatement
  token: Token
  returnType: CType
}

export interface ReturnStatement<V extends Expression = Expression> {
  type: 'ReturnStatement'
  value: V
  token: Token
}

export type Statement =
  | LetStatement
  | ExpressionStatement
  | AssignmentStatement
  | ImportStatement
  | BlockStatement
  | CheckStatement
  | DuringStatement
  | FunctionStatement
  | ReturnStatement

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
  isLocal: boolean
}

export interface PropertyExpression<O extends Expression = Expression> extends BaseNode {
  type: 'PropertyExpression'
  object: O
  property: Identifier
}

export interface MethodCallExpression<
  O extends Expression = Expression,
  A extends Expression = Expression
> extends BaseNode {
  type: 'MethodCallExpression'
  callee: PropertyExpression<O>
  args: A[]
}

export interface PrefixExpression<R extends Expression = Expression> extends BaseNode {
  type: 'PrefixExpression'
  operator: '!'
  right: R
}

export type Expression =
  | Literal
  | InfixExpression
  | CallExpression
  | PropertyExpression
  | MethodCallExpression
  | PrefixExpression
