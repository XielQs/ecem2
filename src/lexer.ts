import { handleError, isAlpha, isDigit } from './common.ts'
import { type Token, TokenType } from './parser/token.ts'

export const KEYWORDS: Record<string, TokenType> = {
  ft: TokenType.FUNCTION,
  let: TokenType.LET,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  check: TokenType.CHECK,
  fail: TokenType.FAIL,
  return: TokenType.RETURN,
  during: TokenType.DURING,
  import: TokenType.IMPORT
}

export default class Lexer {
  public readonly source_code: string
  public readonly file_name: string
  private position = 0
  private read_position = 0
  private ch = '\0'
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
    while (this.ch === ' ' || this.ch === '\t' || this.ch === '\r') {
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
    let str = ''

    this.readChar() // move to the next character after the opening quote
    while (this.ch !== '"' && this.ch !== '\0') {
      if (this.ch === '\\') {
        this.readChar()
        const ESCAPES = ['"', '\\', 'n', 'r', 't', 'b', 'f', 'v', '0']
        // TODO: handle unicode escapes maybe? (\\uXXXX)
        if (ESCAPES.includes(this.ch)) {
          str += '\\' + this.ch
        } else {
          str += this.ch
        }
      } else {
        str += this.ch
      }
      this.readChar()
    }

    if (this.ch === '"') {
      this.readChar() // move past the closing quote
      return str
    } else {
      const line = this.source_code.split('\n')[start_line]
      handleError(
        'Unterminated string literal',
        {
          type: TokenType.ILLEGAL,
          literal: this.ch,
          line: start_line,
          column: start
        },
        this.source_code,
        this.file_name,
        'error',
        {
          spaces: line.slice(this.position - start + 1).length,
          carets: Infinity
        }
      )
      process.exit(1) // unreachable
    }
  }

  public nextToken(): Token {
    this.skipWhitespace()

    const token: Token = {
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
      case '&':
        if (this.peekChar() == '&') {
          this.readChar()
          token.type = TokenType.AND
          token.literal = '&&'
        } else {
          token.type = TokenType.AMPERSAND
          token.literal = '&'
        }
        break
      case '|':
        if (this.peekChar() == '|') {
          this.readChar()
          token.type = TokenType.OR
          token.literal = '||'
        } else {
          token.type = TokenType.PIPE
          token.literal = '|'
        }
        break
      case '<':
        if (this.peekChar() == '=') {
          this.readChar()
          token.type = TokenType.LT_EQ
          token.literal = '<='
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
        } else {
          token.type = TokenType.GT
          token.literal = '>'
        }
        break
      case ';':
        token.type = TokenType.SEMICOLON
        token.literal = ';'
        break
      case ':':
        token.type = TokenType.COLON
        token.literal = ':'
        break
      case ',':
        token.type = TokenType.COMMA
        token.literal = ','
        break
      case '.':
        token.type = TokenType.DOT
        token.literal = '.'
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
        return token
      case '\0':
        token.type = TokenType.END_OF_FILE
        token.literal = ''
        break
      case '\n':
        token.type = TokenType.NEWLINE
        token.literal = '\n'
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
          handleError(
            `Unexpected token ${this.ch}`,
            {
              type: TokenType.ILLEGAL,
              literal: this.ch,
              line: this.line,
              column: this.column
            },
            this.source_code,
            this.file_name,
            'error'
          )
        }
    }

    this.readChar()
    return token
  }
}
