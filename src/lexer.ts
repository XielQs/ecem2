import { handleCompilerError, isAlpha, isDigit } from './common.ts'
import { type Token, TokenType } from './token.ts'

export const KEYWORDS: Record<string, TokenType> = {
  ft: TokenType.FUNCTION,
  let: TokenType.LET,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  if: TokenType.IF,
  else: TokenType.ELSE,
  return: TokenType.RETURN,
  while: TokenType.WHILE
}

export default class Lexer {
  public readonly source_code: string
  public readonly file_name: string
  private position = 0
  private read_position = 0
  private ch: string = '\0'
  private line = 0
  private column = 0

  public constructor(source_code: string, file_name: string) {
    this.source_code = source_code
    this.file_name = file_name
    this.readChar()
  }

  public readChar() {
    if (this.read_position >= this.source_code.length) {
      this.ch = '\0' // EOF
    } else {
      this.ch = this.source_code[this.read_position]
    }

    if (this.ch === '\n') {
      this.line++
      this.column = 0
    } else {
      this.column++
    }

    this.position = this.read_position
    this.read_position++
  }

  public peekChar(): string {
    if (this.read_position >= this.source_code.length) {
      return '\0' // EOF
    }
    return this.source_code[this.read_position]
  }

  public skipWhitespace() {
    while (this.ch == ' ' || this.ch == '\t' || this.ch == '\n' || this.ch == '\r') {
      this.readChar()
    }
  }

  public readIdentifier(): string {
    const start = this.position
    while (isAlpha(this.ch) || isDigit(this.ch)) {
      this.readChar()
    }
    return this.source_code.substring(start, this.position)
  }

  public readNumber(): string {
    const start = this.position
    while (isDigit(this.ch)) {
      this.readChar()
    }
    return this.source_code.substring(start, this.position)
  }

  public readString(): string {
    const start = this.position + 1 // skip the opening quote
    const start_line = this.line
    this.readChar() // move to the next character after the opening quote
    while (this.ch !== '"' && this.ch !== '\0') {
      this.readChar()
    }
    if (this.ch === '"') {
      const str = this.source_code.substring(start, this.position)
      this.readChar() // move past the closing quote
      return str
    } else {
      handleCompilerError(
        'Unterminated string literal',
        {
          type: TokenType.ILLEGAL,
          literal: this.source_code.split('\n')[start_line].slice(start - 1),
          line: start_line,
          column: start - 1
        },
        this.source_code,
        this.file_name
      )
    }
  }

  public nextToken(): Token {
    this.skipWhitespace()

    let token: Token = {
      type: TokenType.ILLEGAL,
      literal: this.ch || '',
      line: this.line,
      column: this.column
    }

    switch (this.ch) {
      case '=':
        if (this.peekChar() == '=') {
          this.readChar()
          token.type = TokenType.EQ
          token.literal = '=='
          token.column--
        } else {
          token.type = TokenType.ASSIGN
          token.literal = '='
        }
        break
      case '!':
        if (this.peekChar() == '=') {
          this.readChar()
          token.type = TokenType.NOT_EQ
          token.literal = '!='
          token.column--
        } else {
          token.type = TokenType.BANG
          token.literal = '!'
        }
        break
      case '+':
        token.type = TokenType.PLUS
        token.literal = '+'
        break
      case '-':
        token.type = TokenType.MINUS
        token.literal = '-'
        break
      case '*':
        token.type = TokenType.ASTERISK
        token.literal = '*'
        break
      case '/':
        if (this.peekChar() == '/') {
          // for single-line comment
          this.readChar()
          // @ts-expect-error - some ts bullshit
          while (this.ch !== '\n' && this.ch !== '\0') {
            this.readChar()
          }
          return this.nextToken()
        } else {
          token.type = TokenType.SLASH
          token.literal = '/'
        }
        break
      case '<':
        if (this.peekChar() == '=') {
          this.readChar()
          token.type = TokenType.LT_EQ
          token.literal = '<='
          token.column--
        } else {
          token.type = TokenType.LT
          token.literal = '<'
        }
        break
      case '>':
        if (this.peekChar() == '=') {
          this.readChar()
          token.type = TokenType.GT_EQ
          token.literal = '>='
          token.column--
        } else {
          token.type = TokenType.GT
          token.literal = '>'
        }
        break
      case '':
        token.type = TokenType.SEMICOLON
        token.literal = ''
        break
      case ':':
        token.type = TokenType.COLON
        token.literal = ':'
        break
      case ',':
        token.type = TokenType.COMMA
        token.literal = ','
        break
      case '(':
        token.type = TokenType.LPAREN
        token.literal = '('
        break
      case ')':
        token.type = TokenType.RPAREN
        token.literal = ')'
        break
      case '{':
        token.type = TokenType.LBRACE
        token.literal = '{'
        break
      case '}':
        token.type = TokenType.RBRACE
        token.literal = '}'
        break
      case '"':
        token.type = TokenType.STRING
        token.literal = this.readString()
        break
      case '\0':
        token.type = TokenType.END_OF_FILE
        token.literal = ''
        break
      default:
        if (isAlpha(this.ch)) {
          token.literal = this.readIdentifier()
          const keywordType = KEYWORDS[token.literal]
          if (keywordType) {
            token.type = keywordType
          } else {
            token.type = TokenType.IDENTIFIER
          }
          return token
        } else if (isDigit(this.ch)) {
          token.type = TokenType.INT
          token.literal = this.readNumber()
          return token
        } else {
          // unexpected character, theated as illegal
        }
        break
    }

    this.readChar()
    return token
  }
}
