import Parser, {
  type BooleanLiteral,
  type CallExpression,
  type InfixExpression,
  type IntegerLiteral,
  type LetStatement,
  type StringLiteral
} from '../src/parser/index.ts'
import { STDModule } from '../src/generator/modules.ts'
import Functions from '../src/generator/functions.ts'
import { describe, it, expect } from 'bun:test'
import { expectPanic } from './utils.ts'
import Lexer from '../src/lexer.ts'

export const enum TESTModule {
  TEST = 'test'
}

// @ts-expect-error - hide STDModule.TEST from type checking
STDModule.TEST = TESTModule.TEST

describe('Parser', () => {
  it('parses single let statement with integer', () => {
    const code = 'let x = 42'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(1)
    const stmt = program.body[0] as LetStatement<IntegerLiteral>
    expect(stmt.type).toBe('LetStatement')
    expect(stmt.name.value).toBe('x')
    expect(stmt.value.type).toBe('IntegerLiteral')
    expect(stmt.value.value).toBe(42)
  })

  it('parses let statement with string', () => {
    const code = 'let s = "hello"'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const stmt = program.body[0] as LetStatement<StringLiteral>
    expect(stmt.value.type).toBe('StringLiteral')
    expect(stmt.value.value).toBe('hello')
  })

  it('parses let statement with boolean true', () => {
    const code = 'let b = true'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const stmt = program.body[0] as LetStatement<BooleanLiteral>
    expect(stmt.value.type).toBe('BooleanLiteral')
    expect(stmt.value.value).toBe(true)
  })

  it('parses let statement with boolean false', () => {
    const code = 'let b = false'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const stmt = program.body[0] as LetStatement<BooleanLiteral>
    expect(stmt.value.type).toBe('BooleanLiteral')
    expect(stmt.value.value).toBe(false)
  })

  it('throws error on duplicate identifier declaration', () => {
    const code = 'let x = 1\nlet x = 2'
    const parser = new Parser(new Lexer(code, 'test'))
    expectPanic(() => parser.parseProgram(), 'Identifier x has already been declared')
  })

  it('throws error on unexpected token', () => {
    const code = 'let = 5'
    const parser = new Parser(new Lexer(code, 'test'))
    expectPanic(() => parser.parseProgram(), 'Unexpected token =')
  })

  it('throws error on unknown value type', () => {
    const code = 'let x = unknown'
    const parser = new Parser(new Lexer(code, 'test'))
    expectPanic(() => parser.parseProgram(), 'Identifier unknown is not defined')
  })

  it('parses multiple let statements', () => {
    const code = 'let a = 1\nlet b = "str"\nlet c = false'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const stmt1 = program.body[0] as LetStatement<IntegerLiteral>
    const stmt2 = program.body[1] as LetStatement<StringLiteral>
    const stmt3 = program.body[2] as LetStatement<BooleanLiteral>
    expect(program.body.length).toBe(3)
    expect(stmt1.name.value).toBe('a')
    expect(stmt2.name.value).toBe('b')
    expect(stmt3.name.value).toBe('c')
  })

  it('parses let statement with infix expression', () => {
    const code = 'let result = 3 + 4'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const stmt = program.body[0] as LetStatement<InfixExpression>
    expect(stmt.value.type).toBe('InfixExpression')
    expect(stmt.value.left.type).toBe('IntegerLiteral')
    expect(stmt.value.right.type).toBe('IntegerLiteral')
    expect(stmt.value.operator).toBe('+')
  })

  it('parses let statement with nested infix expressions', () => {
    const code = 'let result = 1 + 2 * 3 - 4 / 2'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const stmt = program.body[0] as LetStatement<InfixExpression<InfixExpression>>
    expect(stmt.value.type).toBe('InfixExpression')
    expect(stmt.value.left.type).toBe('InfixExpression')
    expect(stmt.value.right.type).toBe('InfixExpression')
    expect(stmt.value.operator).toBe('-')
    expect(stmt.value.left.operator).toBe('+')
    expect(stmt.value.right.operator).toBe('/')
  })

  it('parses let statement with string concatenation', () => {
    const code = 'let greeting = "Hello, " + "world!" + " Again??"'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const stmt = program.body[0] as LetStatement<
      InfixExpression<InfixExpression<StringLiteral>, StringLiteral>
    >
    expect(stmt.value.type).toBe('InfixExpression')
    expect(stmt.value.left.type).toBe('InfixExpression')
    expect(stmt.value.right.type).toBe('StringLiteral')
    expect(stmt.value.operator).toBe('+')
    expect(stmt.value.left.left.type).toBe('StringLiteral')
    expect(stmt.value.left.right.type).toBe('StringLiteral')
    expect(stmt.value.left.operator).toBe('+')
    expect(stmt.value.left.left.value).toBe('Hello, ')
    expect(stmt.value.left.right.value).toBe('world!')
    expect(stmt.value.right.value).toBe(' Again??')
  })

  it('throws error on string concatenation with integer', () => {
    const code = 'let result = "Hello" + 42'
    const parser = new Parser(new Lexer(code, 'test'))
    expectPanic(() => parser.parseProgram(), 'Cannot operate on string and integer')
  })

  it('parses function call with no arguments', () => {
    Functions.register({
      name: 'foo',
      args: [],
      returnType: 'IntegerLiteral',
      module: TESTModule.TEST as unknown as STDModule
    })
    const code = 'import <test>\nlet x = foo()'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const stmt = program.body[1] as LetStatement<CallExpression>
    expect(stmt.value.type).toBe('CallExpression')
    expect(stmt.value.callee.value).toBe('foo')
    expect(stmt.value.args.length).toBe(0)
  })

  it('parses function call with arguments', () => {
    Functions.register({
      name: 'add',
      args: [{ type: ['IntegerLiteral'] }, { type: ['IntegerLiteral'] }],
      returnType: 'IntegerLiteral',
      module: TESTModule.TEST as unknown as STDModule
    })
    const code = 'import <test>\nlet y = add(1, 2)'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const stmt = program.body[1] as LetStatement<CallExpression<IntegerLiteral>>
    expect(stmt.value.type).toBe('CallExpression')
    expect(stmt.value.callee.value).toBe('add')
    expect(stmt.value.args.length).toBe(2)
    expect(stmt.value.args[0].type).toBe('IntegerLiteral')
    expect(stmt.value.args[0].value).toBe(1)
    expect(stmt.value.args[1].type).toBe('IntegerLiteral')
    expect(stmt.value.args[1].value).toBe(2)
  })

  it('parses nested function calls', () => {
    Functions.register({
      name: 'add',
      args: [{ type: ['IntegerLiteral'] }, { type: ['IntegerLiteral'] }],
      returnType: 'IntegerLiteral',
      module: TESTModule.TEST as unknown as STDModule
    })
    Functions.register({
      name: 'double',
      args: [{ type: ['IntegerLiteral'] }],
      returnType: 'IntegerLiteral',
      module: TESTModule.TEST as unknown as STDModule
    })
    const code = 'import <test>\nlet n = double(add(1, 2))'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const stmt = program.body[1] as LetStatement<CallExpression<CallExpression<IntegerLiteral>>>
    expect(stmt.value.type).toBe('CallExpression')
    expect(stmt.value.callee.value).toBe('double')
    expect(stmt.value.args[0].type).toBe('CallExpression')
    expect(stmt.value.args[0].callee.value).toBe('add')
    expect(stmt.value.args[0].args.length).toBe(2)
  })
})
