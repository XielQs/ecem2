import {
  getPrecedence,
  parseTokenAsLiteral,
  type Expression,
  type ExpressionStatement,
  type Identifier,
  type LetStatement,
  type Literal,
  type Program,
  type Statement
} from './index.ts'
import { type Token, TokenType } from './token.ts'
import { handleError } from '../common.ts'
import Lexer from '../lexer.ts'

export default class Parser {
  private readonly lexer: Lexer
  private cur: Token
  private peek: Token
  public identifiers: Record<string, Expression> = {}

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
    if (this.peek.type === type) {
      this.nextToken()
    } else {
      this.throwError(this.peek, `Unexpected token ${this.peek.type}, ${type} expected`)
    }
  }

  private skipNewline(): void {
    while (this.cur.type === TokenType.NEWLINE) {
      this.nextToken()
    }
  }

  private throwError(token: Token, custom_message?: string): never {
    handleError(
      custom_message ||
        (token.type == TokenType.ILLEGAL
          ? 'Unexpected illegal token'
          : `Unexpected token ${token.type}`),
      {
        column: token.column,
        line: token.line,
        literal: (parseTokenAsLiteral(token) || token.literal).toString(),
        type: token.type
      },
      this.lexer.source_code,
      this.lexer.file_name
    )
  }

  public parseProgram(): Program {
    const body: Statement[] = []

    while (this.cur.type !== TokenType.END_OF_FILE) {
      if (this.cur.type === TokenType.NEWLINE) {
        this.nextToken()
        continue
      } else if (this.cur.type === TokenType.LET) {
        body.push(this.parseLetStatement())
      } else {
        const expr = this.parseExpressionStatement()
        if (expr) {
          body.push(expr)
          continue
        }
        this.throwError(this.cur)
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
  ): T extends null ? Literal | null : Literal | never {
    switch (token.type) {
      case TokenType.INT:
        return {
          type: 'IntegerLiteral',
          value: parseInt(token.literal, 10),
          token
        }
      case TokenType.STRING:
        return {
          type: 'StringLiteral',
          value: token.literal,
          token
        }
      case TokenType.TRUE:
        return {
          type: 'BooleanLiteral',
          value: true,
          token
        }
      case TokenType.FALSE:
        return {
          type: 'BooleanLiteral',
          value: false,
          token
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
      token: this.cur
    }

    this.expectPeek(TokenType.ASSIGN)

    this.nextToken()

    const value = this.parseExpression(0, name)

    this.nextToken() // let x = 69

    if (this.identifiers[name.value]) {
      handleError(
        `Identifier ${name.value} has already been declared`,
        {
          column: 0,
          line: name.token.line,
          literal: name.token.literal,
          type: name.token.type
        },
        this.lexer.source_code,
        this.lexer.file_name,
        'panic',
        {
          carets: this.lexer.source_code.split('\n')[name.token.line - 1].length,
          spaces: 0
        }
      )
    }

    this.identifiers[name.value] = value

    return {
      type: 'LetStatement',
      name,
      value
    }
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expression = this.parseExpression(0)
    this.nextToken()
    return {
      type: 'ExpressionStatement',
      expression
    }
  }

  private parseExpression(precedence = 0, identifier?: Identifier): Expression {
    let left = this.parseLiteral(this.cur, identifier || null) as Expression | null

    if (!left) {
      this.throwError(this.cur, `Unexpected token ${this.cur.type} in expression`)
    }

    while (
      this.peek.type !== TokenType.END_OF_FILE &&
      this.peek.type !== TokenType.NEWLINE &&
      precedence < getPrecedence(this.peek)
    ) {
      const operatorToken = this.peek
      const operator = operatorToken.literal
      const opPrecedence = getPrecedence(operatorToken)

      this.nextToken() // consume operator
      this.nextToken() // move to right expression

      const right = this.parseExpression(opPrecedence)

      // check if right and left are same type
      const validTypes = ['IntegerLiteral', 'StringLiteral', 'BooleanLiteral']

      const leftNode = (left.type === 'InfixExpression' ? left.right : left) as Identifier

      if (
        validTypes.includes(leftNode.type) &&
        validTypes.includes(right.type) &&
        leftNode.type !== right.type
      ) {
        this.throwError(
          right.token,
          `Cannot operate on ${leftNode.token.type} and ${right.token.type}`
        )
      }

      left = {
        type: 'InfixExpression',
        operator,
        left,
        right,
        token: operatorToken
      }
    }

    return left
  }
}
