import {
  CTypeToHuman,
  getPrecedence,
  parseTokenAsLiteral,
  type AssignmentStatement,
  type CallExpression,
  type CType,
  type Expression,
  type ExpressionStatement,
  type Identifier,
  type ImportStatement,
  type InfixExpression,
  type LetStatement,
  type Literal,
  type Program,
  type Statement
} from './index.ts'
import LiteralProperties from '../generator/literal-properties.ts'
import LiteralMethods from '../generator/literal-methods.ts'
import { type Token, TokenType } from './token.ts'
import Functions from '../generator/functions.ts'
import { STDModule } from '../generator/index.ts'
import { handleError } from '../common.ts'
import Lexer from '../lexer.ts'

interface IdentifierInfo {
  expression: Expression
  referenced: boolean
  declaredAt: Token
}

interface ImportInfo {
  name: STDModule
  token: Token
  used: boolean
}

export default class Parser {
  private readonly lexer: Lexer
  public cur: Token
  public peek: Token
  public identifiers: Record<string, IdentifierInfo> = {}
  public imports = new Map<STDModule, ImportInfo>()

  public constructor(lexer: Lexer) {
    this.lexer = lexer
    this.cur = this.lexer.nextToken()
    this.peek = this.lexer.nextToken()
  }

  private nextToken(): void {
    this.cur = this.peek
    this.peek = this.lexer.nextToken()
  }

  private expectPeek(type: TokenType): void {
    this.skipNewline()
    this.skipSemicolon()
    if (this.peek.type === type) {
      this.nextToken()
    } else {
      this.throwError(this.peek, `Unexpected token ${this.peek.type} expected ${type}`)
    }
  }

  private skipNewline(): void {
    while (this.cur.type === TokenType.NEWLINE) {
      this.nextToken()
    }
  }

  private skipSemicolon(): void {
    while (this.cur.type === TokenType.SEMICOLON) {
      this.nextToken()
    }
  }

  public throwWarning(
    token: Token,
    message: string,
    custom_mark: { spaces?: number; carets?: number } = {}
  ): void {
    handleError(
      message,
      {
        column: token.column,
        line: token.line,
        literal: (parseTokenAsLiteral(token) ?? token.literal).toString(),
        type: token.type
      },
      this.lexer.source_code,
      this.lexer.file_name,
      'warning',
      custom_mark
    )
  }

  public throwError(
    token: Token,
    custom_message?: string,
    custom_mark: { spaces?: number; carets?: number } = {}
  ): never {
    const literal = (parseTokenAsLiteral(token) ?? token.literal).toString()
    handleError(
      custom_message ??
        (token.type == TokenType.ILLEGAL
          ? 'Unexpected illegal token'
          : `Unexpected token ${token.type}`),
      {
        column: token.column,
        line: token.line,
        literal,
        type: token.type
      },
      this.lexer.source_code,
      this.lexer.file_name,
      'panic',
      custom_mark
    )
    process.exit(1) // unreachable
  }

  public isModuleImported(module: STDModule): boolean {
    return this.imports.has(module)
  }

  public parseProgram(): Program {
    const body: Statement[] = []

    while (this.cur.type !== TokenType.END_OF_FILE) {
      if (this.cur.type === TokenType.NEWLINE) {
        this.nextToken()
        continue
      } else if (this.cur.type === TokenType.LET) {
        body.push(this.parseLetStatement())
      } else if (this.cur.type === TokenType.IDENTIFIER && this.peek.type === TokenType.ASSIGN) {
        body.push(this.parseAssignmentStatement())
      } else if (this.cur.type === TokenType.IMPORT) {
        body.push(this.parseImportStatement())
      } else {
        const expr = this.parseExpressionStatement()
        if (expr) {
          body.push(expr)
          continue
        }
        this.throwError(this.cur)
      }

      this.skipSemicolon()
    }

    // check for unused identifiers
    for (const [name, info] of Object.entries(this.identifiers)) {
      if (!info.referenced) {
        this.throwWarning(info.declaredAt, `Identifier ${name} is declared but never used`)
      }
    }

    // check for unused imports
    for (const [name, info] of this.imports.entries()) {
      if (!info.used) {
        this.throwWarning(info.token, `Module <${name}> is imported but never used`, {
          carets: name.length + 2, // +2 for the < and >
          spaces: info.token.column - 2
        })
      }
    }

    return {
      type: 'Program',
      body
    }
  }

  private parseLiteral<T extends Identifier | null>(
    token: Token,
    identifier: T
  ): T extends null ? Literal | null : Literal {
    switch (token.type) {
      case TokenType.INT:
        return {
          type: 'IntegerLiteral',
          value: parseInt(token.literal, 10),
          token,
          cType: 'IntegerLiteral'
        }
      case TokenType.STRING:
        return {
          type: 'StringLiteral',
          value: token.literal,
          token,
          cType: 'StringLiteral'
        }
      case TokenType.TRUE:
        return {
          type: 'BooleanLiteral',
          value: true,
          token,
          cType: 'BooleanLiteral'
        }
      case TokenType.FALSE:
        return {
          type: 'BooleanLiteral',
          value: false,
          token,
          cType: 'BooleanLiteral'
        }
      case TokenType.IDENTIFIER: {
        const identifier = this.identifiers[token.literal]
        if (!identifier) {
          this.throwError(token, `Identifier ${token.literal} is not defined`)
        }

        return {
          type: 'Identifier',
          value: token.literal,
          token,
          cType: identifier.expression.cType
        }
      }
      default:
        if (!identifier) return null as T extends null ? null : never
        this.throwError(
          token,
          `Unexpected value type ${token.type} for identifier ${identifier.value}`
        )
    }
  }

  private parseLetStatement(): LetStatement {
    this.expectPeek(TokenType.IDENTIFIER)

    const name: Identifier = {
      type: 'Identifier',
      value: this.cur.literal,
      token: this.cur,
      cType: null
    }

    this.expectPeek(TokenType.ASSIGN)

    this.nextToken()

    const value = this.parseExpression(0, name)

    this.nextToken() // let x = 69

    if (this.identifiers[name.value]) {
      // TODO: fix carets when using semicolon

      this.throwError(
        {
          column: 0,
          line: name.token.line,
          literal: name.token.literal,
          type: name.token.type
        },
        `Identifier ${name.value} has already been declared`,
        {
          carets: Infinity,
          spaces: 0
        }
      )
    }

    this.identifiers[name.value] = {
      expression: value,
      referenced: false,
      declaredAt: name.token
    }
    name.cType = value.cType ?? null

    return {
      type: 'LetStatement',
      name,
      value
    }
  }

  private parseAssignmentStatement(): AssignmentStatement {
    const name: Identifier = {
      type: 'Identifier',
      value: this.cur.literal,
      token: this.cur,
      cType: null
    }
    const identifier = this.identifiers[name.value]

    if (!identifier) {
      this.throwError(this.cur, `Identifier ${name.value} is not declared`)
    }

    this.expectPeek(TokenType.ASSIGN)
    this.nextToken()
    const value = this.parseExpression(0)

    if (identifier.expression.cType !== value.cType) {
      this.throwError(
        this.cur,
        `Cannot assign value of type ${CTypeToHuman(value.cType)} to identifier ${
          name.value
        } of type ${CTypeToHuman(identifier.expression.cType)}`
      )
    }
    this.nextToken() // consume the value

    this.identifiers[name.value] = {
      expression: value,
      referenced: false,
      declaredAt: name.token
    }
    name.cType = value.cType ?? null

    return {
      type: 'AssignmentStatement',
      name,
      value
    }
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expression = this.parseExpression(0)
    this.nextToken()
    this.skipSemicolon()
    this.skipNewline()
    return {
      type: 'ExpressionStatement',
      expression,
      token: this.cur,
      cType: expression.cType ?? null
    }
  }

  private getNodeCType(node: Expression): CType | undefined {
    if (node.type === 'InfixExpression') return node.cType ?? null
    if (node.type === 'Identifier') {
      const ref = this.identifiers[node.value]
      return ref.expression.cType ?? 'VoidLiteral'
    }
    if (node.type === 'CallExpression' || node.type === 'MethodCallExpression') {
      return node.callee.cType ?? null
    }
    if (node.type === 'MemberExpression') return node.property.cType ?? null
    return node.type
  }

  private parseExpression(precedence = 0, identifier?: Identifier): Expression {
    let left: Expression | null = null

    if (this.cur.type === TokenType.IDENTIFIER) {
      if (this.peek.type === TokenType.LPAREN) {
        const identifier: Identifier = {
          type: 'Identifier',
          value: this.cur.literal,
          token: this.cur,
          cType: null // will be set later
        }

        const call = this.parseCallExpression(identifier)
        return this.parseMemberAndMethodCalls(call)
      } else {
        left = this.parseLiteral(this.cur, null)
      }
    } else {
      left = this.parseLiteral(this.cur, identifier ?? null)
    }

    if (!left) {
      this.throwError(this.cur, `Unexpected token ${this.cur.type} in expression`)
    }

    if (left.type === 'Identifier' && !this.identifiers[left.value].referenced) {
      this.identifiers[left.value].referenced = true
    }

    while (
      this.peek.type !== TokenType.END_OF_FILE &&
      this.peek.type !== TokenType.NEWLINE &&
      precedence < getPrecedence(this.peek)
    ) {
      if (this.peek.type === TokenType.LPAREN && left.type === 'Identifier') {
        // function call
        const identifier = this.identifiers[this.cur.literal]
        if (!identifier) {
          this.throwError(this.cur, `Identifier ${this.cur.literal} is not defined`)
        }

        return this.parseCallExpression({
          type: 'Identifier',
          value: this.cur.literal,
          token: this.cur,
          cType: identifier.expression.cType ?? null
        })
      }

      // end of call expression
      if (this.peek.type === TokenType.RPAREN) break

      const operatorToken = this.peek
      const operator = operatorToken.literal
      const opPrecedence = getPrecedence(operatorToken)

      this.nextToken() // consume operator
      this.nextToken() // move to right expression

      const right = this.parseExpression(opPrecedence)

      const leftType = this.getNodeCType(left)
      const rightType = this.getNodeCType(right)

      if (!leftType || !rightType) {
        this.throwError(
          operatorToken,
          'Cannot determine type of left or right operand in infix expression'
        )
      }

      if (leftType === 'VoidLiteral' || rightType === 'VoidLiteral') {
        this.throwError(operatorToken, `Cannot operate on void literals`)
      }

      if ((operator === '&&' || operator === '||') && leftType !== 'BooleanLiteral') {
        this.throwError(
          operatorToken,
          `Cannot use logical operator ${operator} on non-boolean type ${CTypeToHuman(leftType)}`
        )
      }

      if (leftType !== rightType) {
        const convertInfo =
          leftType === 'StringLiteral' || rightType === 'StringLiteral'
            ? ', consider using to_string()'
            : ''
        this.throwError(
          operatorToken,
          `Cannot operate on ${CTypeToHuman(leftType)} and ${CTypeToHuman(rightType)}${convertInfo}`
        )
      }

      if (leftType === 'StringLiteral' && operatorToken.type !== TokenType.PLUS) {
        this.throwError(
          operatorToken,
          `Cannot use operator ${operator} on string literals, only + is allowed`
        )
      }

      left = {
        type: 'InfixExpression',
        operator,
        left,
        right,
        token: operatorToken,
        cType: leftType
      } satisfies InfixExpression
    }

    left = this.parseMemberAndMethodCalls(left)

    return left
  }

  private parseCallArguments(): Expression[] {
    this.expectPeek(TokenType.LPAREN)

    const args: Expression[] = []

    if (this.peek.type !== TokenType.RPAREN) {
      this.nextToken() // consume LPAREN
      args.push(this.parseExpression(0))

      while (this.peek.type === TokenType.COMMA) {
        this.nextToken() // consume COMMA
        this.nextToken() // consume next expression
        args.push(this.parseExpression(0))
      }
    }

    this.expectPeek(TokenType.RPAREN)

    return args
  }

  private parseMemberAndMethodCalls(left: Expression): Expression {
    while (this.peek.type === TokenType.DOT) {
      this.nextToken() // consume DOT

      const propertyToken = this.peek
      if (propertyToken.type !== TokenType.IDENTIFIER) {
        this.throwError(propertyToken, `Expected identifier after . got ${propertyToken.type}`)
      }

      this.nextToken() // consume property identifier
      this.peek = this.peek // i hate typescript...

      const objectCType = this.getNodeCType(left)
      if (!objectCType) {
        this.throwError(
          propertyToken,
          `Cannot determine type of object in member expression, expected a valid type but got ${left.type}`
        )
      }

      const methodName = this.cur.literal
      const isCall = this.peek.type === TokenType.LPAREN

      const property: Identifier = {
        type: 'Identifier',
        value: methodName,
        token: propertyToken,
        cType: null // will be set later
      }

      if (isCall) {
        const args = this.parseCallArguments()

        const method = LiteralMethods.get(objectCType, methodName)
        if (!method) {
          const isProperty = LiteralProperties.has(objectCType, methodName)
          return this.throwError(
            propertyToken,
            `${CTypeToHuman(objectCType)} has no method called ${methodName}${
              isProperty ? ', did you mean to use it as a property?' : ''
            }`
          )
        }

        LiteralMethods.validateCall(objectCType, methodName, args, this)

        property.cType = method.returnType

        left = {
          type: 'MethodCallExpression',
          callee: {
            type: 'MemberExpression',
            object: left,
            property,
            token: propertyToken,
            cType: method.returnType
          },
          args,
          token: propertyToken,
          cType: method.returnType
        }
      } else {
        const propertyInfo = LiteralProperties.get(objectCType, methodName)
        if (!propertyInfo) {
          const isMethod = LiteralMethods.has(objectCType, methodName)
          return this.throwError(
            propertyToken,
            `${CTypeToHuman(objectCType)} has no property called ${methodName}${
              isMethod ? ', did you mean to use it as a method?' : ''
            }`
          )
        }

        property.cType = propertyInfo.returnType

        left = {
          type: 'MemberExpression',
          object: left,
          property,
          token: propertyToken,
          cType: property.cType
        }
      }
    }
    return left
  }

  private parseCallExpression(callee: Identifier): CallExpression {
    const cur = this.cur

    const args = this.parseCallArguments()

    const fn = Functions.get(cur.literal)

    if (!fn) {
      this.throwError(cur, `${cur.literal} is not a function`)
    }

    if (!this.isModuleImported(fn.module)) {
      return this.throwError(
        cur,
        `${fn.name} is not a function, did you forget to import <${fn.module}>?`
      )
    }

    Functions.validateCall(fn.name, args, this)

    // make import used
    this.imports.get(fn.module)!.used = true

    callee.cType = fn.returnType

    return {
      type: 'CallExpression',
      token: callee.token,
      callee,
      args,
      cType: fn.returnType ?? null
    }
  }

  private parseImportStatement(): ImportStatement {
    this.expectPeek(TokenType.LT)
    const start = this.cur
    this.nextToken()
    const stmt = this.cur

    const name = stmt.literal as STDModule
    this.expectPeek(TokenType.GT)

    if (!Object.values(STDModule).includes(name)) {
      this.throwError(start, `Unknown module <${name}>`, {
        carets: name.length + 2 // +2 for the < and >
      })
    }
    this.nextToken()

    this.imports.set(name, {
      name,
      token: stmt,
      used: false
    })

    return {
      type: 'ImportStatement',
      name,
      token: stmt
    }
  }
}
