import { describe, it, expect } from 'bun:test'
import Parser from '../src/parser/parser.ts'
import { expectPanic } from './utils.ts'
import Lexer from '../src/lexer.ts'

describe('Stdlib', () => {
  it('parses to_string function call with integer', () => {
    const code = 'import <string>\nlet str = to_string(123)'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(2)
  })

  it('parses to_string function call with boolean', () => {
    const code = 'import <string>\nlet str = to_string(true)'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(2)
  })

  it('parses starts_with function call', () => {
    const code = 'import <string>\nlet result = starts_with("hello", "he")'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(2)
  })

  it('parses ends_with function call', () => {
    const code = 'import <string>\nlet result = ends_with("hello", "lo")'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(2)
  })

  it('parses contains function call', () => {
    const code = 'import <string>\nlet result = contains("hello", "ell")'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(2)
  })

  it('parses sqrt function call', () => {
    const code = 'import <math>\nlet result = sqrt(16)'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(2)
  })

  it('parses pow function call', () => {
    const code = 'import <math>\nlet result = pow(2, 3)'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(2)
  })

  it('parses max function call', () => {
    const code = 'import <math>\nlet result = max(1, 2, 3)'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(2)
  })

  it('parses min function call', () => {
    const code = 'import <math>\nlet result = min(1, 2, 3)'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(2)
  })

  it('parses print function call', () => {
    const code = 'import <io>\nprint("hello")'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(2)
  })

  it('parses input function call', () => {
    const code = 'import <io>\nlet input_str = input("Enter name: ")'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(2)
  })

  it('throws error on calling starts_with with wrong number of arguments', () => {
    const code = 'import <string>\nlet result = starts_with("hello")'
    const parser = new Parser(new Lexer(code, 'test'))
    expectPanic(() => parser.parseProgram(), 'starts_with expects at least 2 argument(s), got 1')
  })
})
