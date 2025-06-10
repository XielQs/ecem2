import { describe, it, expect } from 'bun:test'
import { setupExpectations } from './utils.ts'
import Parser from '../src/parser/index.ts'
import Lexer from '../src/lexer.ts'

describe('ErrorHandler', () => {
  it('reports error location for unexpected token', () => {
    const code = 'let x = unknown'
    const parser = new Parser(new Lexer(code, 'test'))
    const output = setupExpectations(() => parser.parseProgram())
    expect(output[0]).toBe('test:1:9\n')
    expect(output[1]).toBe('let x = unknown\n')
    expect(output[2]).toBe('        ^^^^^^^\n')
  })

  it('reports error location for duplicate identifier', () => {
    const code = 'let x = 1\nlet x = 2'
    const parser = new Parser(new Lexer(code, 'test'))
    const output = setupExpectations(() => parser.parseProgram())
    expect(output[0]).toBe('test:2\n')
    expect(output[1]).toBe('let x = 2\n')
    expect(output[2]).toBe('^^^^^^^^^\n')
  })

  it('reports error location for unterminated string', () => {
    const code = 'let s = "unterminated'
    const parser = new Parser(new Lexer(code, 'test'))
    const output = setupExpectations(() => parser.parseProgram())
    expect(output[0]).toBe('test:1:9\n')
    expect(output[1]).toBe('let s = "unterminated\n')
    expect(output[2]).toBe('        ^^^^^^^^^^^^^\n')
  })

  it('reports error location for unexpected end of file', () => {
    const code = 'let x = 1\nlet y ='
    const parser = new Parser(new Lexer(code, 'test'))
    const output = setupExpectations(() => parser.parseProgram())
    expect(output[0]).toBe('test:2:8\n')
    expect(output[1]).toBe('let y =\n')
    expect(output[2]).toBe('       ^\n')
  })

  it('reports error location for illegal character', () => {
    const code = 'let x = 1 @'
    const parser = new Parser(new Lexer(code, 'test'))
    const output = setupExpectations(() => parser.parseProgram())
    expect(output[0]).toBe('test:1:11\n')
    expect(output[1]).toBe('let x = 1 @\n')
    expect(output[2]).toBe('          ^\n')
  })
})
