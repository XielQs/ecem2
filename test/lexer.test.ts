import { type Token, TokenType } from '../src/parser/token.ts'
import { describe, it, expect } from 'bun:test'
import { expectPanic } from './utils.ts'
import Lexer from '../src/lexer.ts'

describe('Lexer', () => {
  it('should tokenize identifiers and keywords', () => {
    const code = 'let x = 5 return x'
    const lexer = new Lexer(code, 'test')
    const tokens: Token[] = []
    let token: Token
    do {
      token = lexer.nextToken()
      tokens.push(token)
    } while (token.type !== TokenType.END_OF_FILE)

    expect(tokens.map(t => t.type)).toEqual([
      TokenType.LET,
      TokenType.IDENTIFIER,
      TokenType.ASSIGN,
      TokenType.INT,
      TokenType.RETURN,
      TokenType.IDENTIFIER,
      TokenType.END_OF_FILE
    ])
    expect(tokens[1].literal).toBe('x')
    expect(tokens[3].literal).toBe('5')
    expect(tokens[5].literal).toBe('x')
  })

  it('should tokenize operators and delimiters', () => {
    const code = '= == != ! + - * / < <= > >= ( ) { } , :'
    const lexer = new Lexer(code, 'test')
    const expectedTypes = [
      TokenType.ASSIGN,
      TokenType.EQ,
      TokenType.NOT_EQ,
      TokenType.BANG,
      TokenType.PLUS,
      TokenType.MINUS,
      TokenType.ASTERISK,
      TokenType.SLASH,
      TokenType.LT,
      TokenType.LT_EQ,
      TokenType.GT,
      TokenType.GT_EQ,
      TokenType.LPAREN,
      TokenType.RPAREN,
      TokenType.LBRACE,
      TokenType.RBRACE,
      TokenType.COMMA,
      TokenType.COLON,
      TokenType.END_OF_FILE
    ]
    const tokens: Token[] = []
    let token: Token
    do {
      token = lexer.nextToken()
      tokens.push(token)
    } while (token.type !== TokenType.END_OF_FILE)

    expect(tokens.map(t => t.type)).toEqual(expectedTypes)
  })

  it('should tokenize string literals', () => {
    const code = 'let s = "hello world"'
    const lexer = new Lexer(code, 'test')
    const tokens: Token[] = []
    let token: Token
    do {
      token = lexer.nextToken()
      tokens.push(token)
    } while (token.type !== TokenType.END_OF_FILE)

    expect(tokens[0].type).toBe(TokenType.LET)
    expect(tokens[1].type).toBe(TokenType.IDENTIFIER)
    expect(tokens[2].type).toBe(TokenType.ASSIGN)
    expect(tokens[3].type).toBe(TokenType.STRING)
    expect(tokens[3].literal).toBe('hello world')
  })

  it('should skip comments', () => {
    const code = 'let x = 5 // this is a comment\nx'
    const lexer = new Lexer(code, 'test')
    const tokens: Token[] = []
    let token: Token
    do {
      token = lexer.nextToken()
      tokens.push(token)
    } while (token.type !== TokenType.END_OF_FILE)

    expect(tokens.map(t => t.type)).toEqual([
      TokenType.LET,
      TokenType.IDENTIFIER,
      TokenType.ASSIGN,
      TokenType.INT,
      TokenType.IDENTIFIER,
      TokenType.END_OF_FILE
    ])
  })

  it('should handle unterminated string literal', () => {
    const code = 'let s = "unterminated'
    const lexer = new Lexer(code, 'test')

    lexer.nextToken() // let
    lexer.nextToken() // s
    lexer.nextToken() // =

    expectPanic(() => lexer.nextToken(), 'Unterminated string literal')
  })
})
