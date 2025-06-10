import type { Identifier, LetStatement, Literal, Program, Statement } from './ast.ts'
import { type Token, TokenType } from './token.ts'
import { handleCompilerError } from './common.ts'
import Lexer from './lexer.ts'

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
      handleCompilerError(
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
        handleCompilerError(
          `Unexpected token '${this.cur.type}'`,
          this.cur,
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

  private parseLetStatement(): LetStatement {
    this.expectPeek(TokenType.IDENTIFIER)

    const name: Identifier = {
      type: 'Identifier',
      value: this.cur.literal,
      token: this.cur
    }

    this.expectPeek(TokenType.ASSIGN)

    this.nextToken()

    let value: Literal

    switch (this.cur.type) {
      case TokenType.INT:
        value = {
          type: 'IntegerLiteral',
          value: parseInt(this.cur.literal, 10),
          token: this.cur
        }
        break
      case TokenType.STRING:
        value = {
          type: 'StringLiteral',
          value: this.cur.literal,
          token: this.cur
        }
        break
      case TokenType.TRUE:
        value = {
          type: 'BooleanLiteral',
          value: true,
          token: this.cur
        }
        break
      case TokenType.FALSE:
        value = {
          type: 'BooleanLiteral',
          value: false,
          token: this.cur
        }
        break
      default:
        handleCompilerError(
          `Unexpected value type '${this.cur.type}' for identifier '${name.value}'`,
          this.cur,
          this.lexer.source_code,
          this.lexer.file_name
        )
    }

    this.nextToken() // let x = 69

    if (this.identifiers[name.value]) {
      handleCompilerError(
        `Identifier '${name.value}' has already been declared`,
        {
          column: 0,
          line: name.token.line,
          literal: name.token.literal,
          type: name.token.type
        },
        this.lexer.source_code,
        this.lexer.file_name,
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
