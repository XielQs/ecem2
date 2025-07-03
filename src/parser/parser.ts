import {
  CTypeToHuman,
  getPrecedence,
  parseTokenAsLiteral,
  type AssignmentStatement,
  type BlockStatement,
  type CallExpression,
  type CheckStatement,
  type CType,
  type DuringStatement,
  type Expression,
  type ExpressionStatement,
  type FunctionStatement,
  type Identifier,
  type ImportStatement,
  type InfixExpression,
  type LetStatement,
  type Literal,
  type Program,
  type ReturnStatement,
  type Statement
} from './index.ts'
import ScopeManager, { type FunctionInfo, type IdentifierInfo } from './scope-manager.ts'
import { isPrimitiveType, primitiveTypes, type Token, TokenType } from './token.ts'
import LiteralProperties from '../generator/literal-properties.ts'
import FunctionValidator from '../generator/function-validator.ts'
import LiteralMethods from '../generator/literal-methods.ts'
import Functions from '../generator/functions.ts'
import { STDModule } from '../generator/index.ts'
import { handleError } from '../common.ts'
import Lexer from '../lexer.ts'

interface ImportInfo {
  name: STDModule
  token: Token
  used: boolean
}

interface ScopeManagers {
  identifiers: ScopeManager<IdentifierInfo>
  functions: ScopeManager<FunctionInfo>
}

export default class Parser {
  private readonly lexer: Lexer
  public readonly scopes: ScopeManagers
  public cur: Token
  public peek: Token
  public imports = new Map<STDModule, ImportInfo>()

  public constructor(lexer: Lexer) {
    this.lexer = lexer
    this.scopes = {
      identifiers: new ScopeManager<IdentifierInfo>(),
      functions: new ScopeManager<FunctionInfo>()
    }
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

  private expectCur(type: TokenType, noNext = false): void {
    this.skipNewline()
    this.skipSemicolon()
    if (this.cur.type === type) {
      if (!noNext) this.nextToken()
    } else {
      this.throwError(this.cur, `Unexpected token ${this.cur.type} expected ${type}`)
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
      }

      const stmt = this.parseStatement()
      if (stmt) {
        body.push(stmt)
      }

      this.nextToken()
      this.skipSemicolon()
    }

    const unused_identifiers = [
      ...this.scopes.identifiers.currentScope.entries(),
      ...this.scopes.identifiers.unuseds.entries()
    ]

    // check for unused identifiers
    for (const [name, info] of unused_identifiers) {
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
        const identifier = this.scopes.identifiers.resolve(token.literal)
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

  private parseStatement(): Statement | null {
    switch (this.cur.type) {
      case TokenType.LET:
        return this.parseLetStatement()
      case TokenType.CHECK:
        return this.parseCheckStatement()
      case TokenType.DURING:
        return this.parseDuringStatement()
      case TokenType.IMPORT:
        return this.parseImportStatement()
      case TokenType.FUNCTION:
        return this.parseFunctionStatement()
      case TokenType.RETURN:
        return this.parseReturnStatement()
      case TokenType.IDENTIFIER:
        if (this.peek.type === TokenType.ASSIGN) {
          return this.parseAssignmentStatement()
        }
        return this.parseExpressionStatement()
      default:
        return this.parseExpressionStatement()
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

    if (value.cType === 'VoidLiteral') {
      this.throwError(value.token, `Cannot assign void literal to identifier ${name.value}`, {
        carets: Infinity,
        spaces: name.token.column - 1 - 'let '.length // -1 because we want to point to the identifier itself
      })
    }

    this.nextToken() // let x = 69

    if (this.scopes.identifiers.hasScope(name.value)) {
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
          spaces: name.token.column - 1 - 'let '.length // -1 because we want to point to the identifier itself
        }
      )
    }

    this.scopes.identifiers.define(name.value, {
      expression: value,
      referenced: false,
      declaredAt: name.token
    })
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
    const identifier = this.scopes.identifiers.resolve(name.value)

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

    this.scopes.identifiers.define(name.value, {
      expression: value,
      referenced: identifier.referenced,
      declaredAt: name.token
    })
    name.cType = value.cType ?? null

    return {
      type: 'AssignmentStatement',
      name,
      value
    }
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expression = this.parseExpression(0)
    return {
      type: 'ExpressionStatement',
      expression,
      token: expression.token,
      cType: expression.cType ?? null
    }
  }

  private getNodeCType(node: Expression): CType | undefined {
    if (node.type === 'InfixExpression' || node.type === 'PrefixExpression') {
      return node.cType ?? null
    }
    if (node.type === 'Identifier') {
      const ref = this.scopes.identifiers.resolve(node.value)
      if (!ref) this.throwError(node.token, `Identifier ${node.value} is not defined`)
      return ref.expression.cType ?? 'VoidLiteral'
    }
    if (node.type === 'CallExpression' || node.type === 'MethodCallExpression') {
      return node.callee.cType ?? null
    }
    if (node.type === 'PropertyExpression') return node.property.cType ?? null
    return node.type
  }

  private parseExpression(precedence = 0, identifier?: Identifier): Expression {
    if (this.cur.type === TokenType.BANG) {
      const token = this.cur
      this.nextToken()
      const right = this.parseExpression(getPrecedence(token))

      const rightType = this.getNodeCType(right)

      if (!rightType) {
        this.throwError(token, 'Cannot determine type of right operand in prefix expression')
      }

      if (!['BooleanLiteral', 'StringLiteral', 'IntegerLiteral'].includes(rightType)) {
        this.throwError(token, `Cannot use ! operator on ${CTypeToHuman(rightType)}`)
      }

      return {
        type: 'PrefixExpression',
        operator: '!',
        right,
        token,
        cType: 'BooleanLiteral'
      }
    }

    let left: Expression | null = null

    if (this.cur.type === TokenType.IDENTIFIER) {
      if (this.peek.type === TokenType.LPAREN) {
        const identifier: Identifier = {
          type: 'Identifier',
          value: this.cur.literal,
          token: this.cur,
          cType: null // will be set later
        }

        left = this.parseCallExpression(identifier)
        left = this.parsePropertyAndMethodCalls(left)
      } else {
        left = this.parseLiteral(this.cur, null)
      }
    } else {
      left = this.parseLiteral(this.cur, identifier ?? null)
    }

    if (!left) {
      this.throwError(this.cur, `Unexpected token ${this.cur.type} in expression`)
    }

    if (left.type === 'Identifier' && !this.scopes.identifiers.resolve(left.value)!.referenced) {
      this.scopes.identifiers.resolve(left.value)!.referenced = true
    }

    left = this.parsePropertyAndMethodCalls(left)

    while (
      this.peek.type !== TokenType.END_OF_FILE &&
      this.peek.type !== TokenType.NEWLINE &&
      precedence < getPrecedence(this.peek)
    ) {
      if (this.peek.type === TokenType.LPAREN && left.type === 'Identifier') {
        // function call
        const identifier = this.scopes.identifiers.resolve(this.cur.literal)
        if (!identifier) {
          this.throwError(this.cur, `Identifier ${this.cur.literal} is not defined`)
        }

        left = this.parseCallExpression({
          type: 'Identifier',
          value: this.cur.literal,
          token: this.cur,
          cType: identifier.expression.cType ?? null
        })
        left = this.parsePropertyAndMethodCalls(left)
        continue
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

      if (operator === '==' || operator === '!=') {
        if (leftType !== rightType) {
          this.throwError(
            operatorToken,
            `Cannot compare ${CTypeToHuman(leftType)} and ${CTypeToHuman(rightType)}`
          )
        }

        left = {
          type: 'InfixExpression',
          operator,
          left,
          right,
          token: operatorToken,
          cType: 'BooleanLiteral'
        }
        continue
      }

      if (['<', '>', '<=', '>='].includes(operator)) {
        if (leftType !== 'IntegerLiteral' || rightType !== 'IntegerLiteral') {
          this.throwError(
            operatorToken,
            `Cannot use comparison operator ${operator} on non-integer types`
          )
        }
        left = {
          type: 'InfixExpression',
          operator,
          left,
          right,
          token: operatorToken,
          cType: 'BooleanLiteral'
        }
        continue
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

  private parseFunctionArgument(): Identifier {
    if (!isPrimitiveType(this.cur.literal)) {
      this.throwError(this.cur, `Expected primitive type after ( got ${this.cur.type}`)
    }
    const primitiveType = primitiveTypes[this.cur.literal]
    this.nextToken() // consume primitive type

    this.expectCur(TokenType.IDENTIFIER, true)

    return {
      type: 'Identifier',
      value: this.cur.literal,
      token: this.cur,
      cType: primitiveType
    }
  }

  private parseFunctionArguments(): Identifier[] {
    this.expectPeek(TokenType.LPAREN)

    const args: Identifier[] = []

    if (this.peek.type !== TokenType.RPAREN) {
      this.nextToken() // consume LPAREN
      args.push(this.parseFunctionArgument())

      while (this.peek.type === TokenType.COMMA) {
        this.nextToken() // consume COMMA
        this.nextToken() // consume next token
        args.push(this.parseFunctionArgument())
      }
    }

    this.expectPeek(TokenType.RPAREN)

    return args
  }

  private parsePropertyAndMethodCalls(left: Expression): Expression {
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
          `Cannot determine type of object in property expression, expected a valid type but got ${left.type}`
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
            type: 'PropertyExpression',
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
          type: 'PropertyExpression',
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

    const userFn = this.scopes.functions.resolve(cur.literal)

    if (userFn) {
      FunctionValidator.validateCall(
        userFn.statement.name.value,
        args,
        userFn.statement.args.map(arg => ({
          type: [arg.cType],
          optional: false,
          variadic: false,
          name: arg.value
        })),
        this,
        this.cur
      )

      userFn.referenced = true
      callee.cType = userFn.statement.returnType
      return {
        type: 'CallExpression',
        token: callee.token,
        callee,
        args,
        isLocal: true,
        cType: userFn.statement.returnType
      }
    }

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
      isLocal: false,
      cType: fn.returnType
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

  private parseBlockStatement(identifiers?: Identifier[]): BlockStatement {
    const block: BlockStatement = {
      type: 'BlockStatement',
      statements: [],
      token: this.cur
    }

    this.scopes.identifiers.enterScope()
    this.scopes.functions.enterScope()

    this.nextToken()
    this.expectCur(TokenType.LBRACE)

    if (identifiers) {
      for (const identifier of identifiers) {
        this.scopes.identifiers.define(identifier.value, {
          expression: identifier,
          referenced: false,
          declaredAt: identifier.token
        })
      }
    }

    while (this.cur.type !== TokenType.RBRACE && this.cur.type !== TokenType.END_OF_FILE) {
      this.skipNewline()
      this.cur = this.cur // ts is being ts
      if (this.cur.type === TokenType.RBRACE) {
        break // end of block
      }
      const stmt = this.parseStatement()
      if (stmt) {
        block.statements.push(stmt)
      }
      this.cur = this.cur // ts is being ts
      if (this.cur.type !== TokenType.RBRACE) this.nextToken() // move to next token if not at the end of block
      this.skipSemicolon()
      this.skipNewline()
    }

    this.expectCur(TokenType.RBRACE)

    this.scopes.identifiers.exitScope()
    this.scopes.functions.exitScope()

    return block
  }

  private parseCheckStatement(): CheckStatement {
    const token = this.cur

    this.nextToken()
    this.skipNewline()
    if (this.cur.type === TokenType.LPAREN) {
      this.throwError(
        this.cur,
        `Unexpected token ${this.cur.type} in check statement, expected condition expression`
      )
    }
    const condition = this.parseExpression(0)

    if (condition.cType !== 'BooleanLiteral') {
      this.throwError(
        condition.token,
        `Expected condition expression to be of type boolean, got ${CTypeToHuman(condition.cType)}`
      )
    }

    const body = this.parseBlockStatement()

    let fail: BlockStatement | null = null
    let failCheck: CheckStatement | null = null

    this.skipNewline()
    if (this.cur.type === TokenType.FAIL) {
      if (this.peek.type === TokenType.CHECK) {
        this.nextToken() // consume FAIL
        failCheck = this.parseCheckStatement()
      } else {
        fail = this.parseBlockStatement()
      }
    }

    return {
      type: 'CheckStatement',
      condition,
      body,
      fail,
      failCheck,
      token
    }
  }

  private parseDuringStatement(): DuringStatement {
    const token = this.cur

    this.nextToken()
    this.skipNewline()
    if (this.cur.type === TokenType.LPAREN) {
      this.throwError(
        this.cur,
        `Unexpected token ${this.cur.type} in during statement, expected condition expression`
      )
    }
    const condition = this.parseExpression(0)

    if (condition.cType !== 'BooleanLiteral') {
      this.throwError(
        condition.token,
        `Expected condition expression to be of type boolean, got ${CTypeToHuman(condition.cType)}`
      )
    }

    const body = this.parseBlockStatement()

    let fail: BlockStatement | null = null

    this.skipNewline()
    if (this.cur.type === TokenType.FAIL) {
      fail = this.parseBlockStatement()
    }

    return {
      type: 'DuringStatement',
      condition,
      body,
      fail,
      token
    }
  }

  private parseReturnStatement(): ReturnStatement {
    const token = this.cur
    this.nextToken() // consume RETURN
    if (this.cur.type === TokenType.NEWLINE || this.cur.type === TokenType.SEMICOLON) {
      // return without value
      return {
        type: 'ReturnStatement',
        value: {
          type: 'VoidLiteral',
          value: undefined,
          token,
          cType: 'VoidLiteral'
        },
        token
      }
    }
    const value = this.parseExpression(0)
    this.nextToken() // consume the value

    return {
      type: 'ReturnStatement',
      value,
      token
    }
  }

  private parseFunctionStatement(): FunctionStatement {
    this.expectPeek(TokenType.IDENTIFIER)

    const name: Identifier = {
      type: 'Identifier',
      value: this.cur.literal,
      token: this.cur,
      cType: null
    }

    const args = this.parseFunctionArguments()
    const hasBuiltin = Functions.has(name.value)
    if (hasBuiltin) {
      const imported = this.isModuleImported(Functions.get(name.value)!.module)
      if (imported) {
        this.throwError(
          name.token,
          `Function ${name.value} is a built-in function and cannot be redefined`,
          {
            carets: Infinity,
            spaces: name.token.column - 1 - 'function '.length // -1 because we want to point to the identifier itself
          }
        )
      }
    }
    if (
      this.scopes.functions.hasScope(name.value) ||
      this.scopes.identifiers.hasScope(name.value)
    ) {
      this.throwError(name.token, `Function ${name.value} has already been declared`, {
        carets: Infinity,
        spaces: name.token.column - 1 - 'function '.length // -1 because we want to point to the identifier itself
      })
    }

    const errMsg = 'Expected -> after function arguments, got %s'

    if (this.peek.type !== TokenType.MINUS) {
      this.throwError(this.peek, errMsg.replace('%s', this.peek.type))
    }
    this.nextToken() // consume RPAREN
    this.peek = this.peek
    if (this.peek.type !== TokenType.GT) {
      this.throwError(this.peek, errMsg.replace('%s', this.peek.type))
    }
    this.nextToken() // consume -
    this.nextToken() // consume the -> token (>)

    const returnType = this.cur.literal
    if (!isPrimitiveType(returnType)) {
      this.throwError(this.cur, `Expected return type after -> got ${this.cur.type}`)
    }
    name.cType = primitiveTypes[returnType]

    const functionInfo = {
      statement: {
        type: 'FunctionStatement',
        name,
        args,
        body: {
          type: 'BlockStatement',
          statements: [] as Statement[],
          token: name.token
        }, // dummy data, will be set later
        token: this.cur,
        returnType: name.cType
      },
      referenced: false,
      declaredAt: this.cur
    } satisfies FunctionInfo
    this.scopes.functions.define(name.value, functionInfo)

    const body = this.parseBlockStatement(args)

    const returnStatements = body.statements.filter(stmt => stmt.type === 'ReturnStatement')
    const wrongReturnType = returnStatements.find(
      stmt => stmt.value.cType !== primitiveTypes[returnType]
    )

    if (wrongReturnType) {
      this.throwError(
        wrongReturnType.value.token,
        `Return type ${CTypeToHuman(
          wrongReturnType.value.cType
        )} does not match function return type ${returnType}`,
        {
          carets: Infinity,
          spaces: wrongReturnType.token.column - 1
        }
      )
    }
    functionInfo.statement.body = body

    return functionInfo.statement
  }
}
