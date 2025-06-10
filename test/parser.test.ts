import { describe, it, expect } from 'bun:test'
import Parser from '../src/parser/index.ts'
import { expectPanic } from './utils.ts'
import Lexer from '../src/lexer.ts'

describe('Parser', () => {
  it('parses single let statement with integer', () => {
    const code = 'let x = 42'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(1)
    const stmt = program.body[0]
    expect(stmt.type).toBe('LetStatement')
    expect(stmt.name.value).toBe('x')
    expect(stmt.value.type).toBe('IntegerLiteral')
    expect(stmt.value.value).toBe(42)
  })

  it('parses let statement with string', () => {
    const code = 'let s = "hello"'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body[0].value.type).toBe('StringLiteral')
    expect(program.body[0].value.value).toBe('hello')
  })

  it('parses let statement with boolean true', () => {
    const code = 'let b = true'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body[0].value.type).toBe('BooleanLiteral')
    expect(program.body[0].value.value).toBe(true)
  })

  it('parses let statement with boolean false', () => {
    const code = 'let b = false'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body[0].value.type).toBe('BooleanLiteral')
    expect(program.body[0].value.value).toBe(false)
  })

  it('throws error on duplicate identifier declaration', () => {
    const code = 'let x = 1\nlet x = 2'
    const parser = new Parser(new Lexer(code, 'test'))
    expectPanic(() => parser.parseProgram(), "Identifier 'x' has already been declared")
  })

  it('throws error on unexpected token', () => {
    const code = 'let = 5'
    const parser = new Parser(new Lexer(code, 'test'))
    expectPanic(() => parser.parseProgram(), "Unexpected token '='")
  })

  it('throws error on unknown value type', () => {
    const code = 'let x = unknown'
    const parser = new Parser(new Lexer(code, 'test'))
    expectPanic(() => parser.parseProgram(), 'Unexpected value type identifier for identifier x')
  })

  it('parses multiple let statements', () => {
    const code = 'let a = 1\nlet b = "str"\nlet c = false'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(3)
    expect(program.body[0].name.value).toBe('a')
    expect(program.body[1].name.value).toBe('b')
    expect(program.body[2].name.value).toBe('c')
  })
})
