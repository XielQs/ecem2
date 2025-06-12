import Functions from '../src/generator/functions.ts'
import Parser from '../src/parser/parser.ts'
import { expectPanic } from './utils.ts'
import { describe, expect } from 'bun:test'
import Lexer from '../src/lexer.ts'
import { it } from 'bun:test'

describe('Functions', () => {
  it('throws error on calling unknown function', () => {
    const code = 'let z = unknownFn()'
    const parser = new Parser(new Lexer(code, 'test'))
    expectPanic(() => parser.parseProgram(), 'unknownFn is not a function')
  })

  it('throws error on function call with wrong argument type', () => {
    Functions.register({
      name: 'negate',
      args: [{ type: ['BooleanLiteral'] }],
      returnType: 'BooleanLiteral'
    })
    const code = 'let b = negate(123)'
    const parser = new Parser(new Lexer(code, 'test'))
    expectPanic(() => parser.parseProgram(), 'Argument 1 of negate must be boolean, got integer')
  })

  it('throws error on function call with wrong number of arguments', () => {
    Functions.register({
      name: 'add',
      args: [{ type: ['IntegerLiteral'] }, { type: ['IntegerLiteral'] }],
      returnType: 'IntegerLiteral'
    })
    const code = 'let result = add(1, 2, 3)'
    const parser = new Parser(new Lexer(code, 'test'))
    expectPanic(() => parser.parseProgram(), 'add expects 2 argument(s), got 3')
  })

  it('throws error on function call with missing arguments', () => {
    Functions.register({
      name: 'concat',
      args: [{ type: ['StringLiteral'] }, { type: ['StringLiteral'] }],
      returnType: 'StringLiteral'
    })
    const code = 'let result = concat("Hello")'
    const parser = new Parser(new Lexer(code, 'test'))
    expectPanic(() => parser.parseProgram(), 'concat expects 2 argument(s), got 1')
  })
})
