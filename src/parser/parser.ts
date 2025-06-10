import {
  parseTokenAsLiteral,
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
  public identifiers: Record<string, Literal> = {}

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
    if (this.peek.type === type) {
      this.nextToken()
    } else {
      handleError(
        `Unexpected token '${this.peek.type}', ${type} expected`,
        {
          column: this.peek.column,
          line: this.peek.line,
          literal: this.peek.literal,
          type: this.peek.type
        },
        this.lexer.source_code,
        this.lexer.file_name
      )
    }
  }

  public parseProgram(): Program {
    const body: Statement[] = []

    while (this.cur.type !== TokenType.END_OF_FILE) {
      if (this.cur.type === TokenType.LET) {
        body.push(this.parseLetStatement())
      } else {
        handleError(
          this.cur.type == TokenType.ILLEGAL
            ? 'Unexpected illegal token'
            : `Unexpected token ${this.cur.type}`,
          {
            column: this.cur.column,
            line: this.cur.line,
            literal: (parseTokenAsLiteral(this.cur) || this.cur.literal).toString(),
            type: this.cur.type
          },
          this.lexer.source_code,
          this.lexer.file_name
        )
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
        handleError(
          `Unexpected value type ${token.type} for identifier ${identifier.value}`,
          token,
          this.lexer.source_code,
          this.lexer.file_name
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

    const value = this.parseLiteral(this.cur, name)

    this.nextToken() // let x = 69

    if (this.identifiers[name.value]) {
      handleError(
        `Identifier '${name.value}' has already been declared`,
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
}
