import Parser, {
  type BooleanLiteral,
  type CallExpression,
  type CheckStatement,
  type DuringStatement,
  type Expression,
  type InfixExpression,
  type IntegerLiteral,
  type LetStatement,
  type MethodCallExpression,
  type StringLiteral
} from '../src/parser/index.ts'
import LiteralMethods from '../src/generator/literal-methods.ts'
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
  it('parses single let statement with int', () => {
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

  it('throws error on string concatenation with int', () => {
    const code = 'let result = "Hello" + 42'
    const parser = new Parser(new Lexer(code, 'test'))
    expectPanic(() => parser.parseProgram(), 'Cannot operate on string and int')
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

  it('parses method call with no arguments', () => {
    LiteralMethods.register('StringLiteral', {
      name: 'testMethod',
      returnType: 'StringLiteral',
      args: []
    })
    const code = 'let s = "hello".testMethod()'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const stmt = program.body[0] as LetStatement<MethodCallExpression>
    expect(stmt.value.type).toBe('MethodCallExpression')
    expect(stmt.value.callee.property.value).toBe('testMethod')
    expect(stmt.value.args.length).toBe(0)
  })

  it('parses method call with arguments', () => {
    LiteralMethods.register('StringLiteral', {
      name: 'testMethod',
      returnType: 'StringLiteral',
      args: [{ type: ['IntegerLiteral'] }]
    })
    const code = 'let s = "hello".testMethod(123)'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const stmt = program.body[0] as LetStatement<MethodCallExpression<Expression, IntegerLiteral>>
    expect(stmt.value.type).toBe('MethodCallExpression')
    expect(stmt.value.callee.property.value).toBe('testMethod')
    expect(stmt.value.args.length).toBe(1)
    expect(stmt.value.args[0].value).toBe(123)
  })

  it('parses nested method calls', () => {
    LiteralMethods.register('StringLiteral', {
      name: 'method1',
      returnType: 'StringLiteral',
      args: []
    })
    LiteralMethods.register('StringLiteral', {
      name: 'method2',
      returnType: 'StringLiteral',
      args: []
    })
    const code = 'let s = "hello".method1().method2()'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const stmt = program.body[0] as LetStatement<MethodCallExpression<MethodCallExpression>>
    expect(stmt.value.type).toBe('MethodCallExpression')
    expect(stmt.value.callee.property.value).toBe('method2')
    expect(stmt.value.callee.object.callee.property.value).toBe('method1')
  })

  it('parses nested function calls with method calls', () => {
    Functions.register({
      name: 'process',
      args: [{ type: ['StringLiteral'] }],
      returnType: 'IntegerLiteral',
      module: TESTModule.TEST as unknown as STDModule
    })
    LiteralMethods.register('StringLiteral', {
      name: 'upper',
      returnType: 'StringLiteral',
      args: []
    })
    const code = 'import <test>\nlet result = process("hello".upper())'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const stmt = program.body[1] as LetStatement<CallExpression<MethodCallExpression>>
    expect(stmt.value.type).toBe('CallExpression')
    expect(stmt.value.callee.value).toBe('process')
    expect(stmt.value.args[0].callee.property.value).toBe('upper')
  })

  it('parses simple during statement', () => {
    const code = 'during true { let x = 1 }'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(1)
    const stmt = program.body[0] as DuringStatement<BooleanLiteral>
    expect(stmt.type).toBe('DuringStatement')
    expect(stmt.condition.type).toBe('BooleanLiteral')
    expect(stmt.condition.value).toBe(true)
    expect(stmt.body.type).toBe('BlockStatement')
    expect(stmt.body.statements.length).toBe(1)
  })

  it('parses during statement with fail block', () => {
    const code = 'during true { let x = 1 } fail { let y = 2 }'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(1)
    const stmt = program.body[0] as DuringStatement<BooleanLiteral>
    expect(stmt.type).toBe('DuringStatement')
    expect(stmt.condition.type).toBe('BooleanLiteral')
    expect(stmt.condition.value).toBe(true)
    expect(stmt.body.type).toBe('BlockStatement')
    expect(stmt.body.statements.length).toBe(1)
    expect(stmt.fail?.type).toBe('BlockStatement')
    expect(stmt.fail?.statements.length).toBe(1)
  })

  it('parses during statement with infix expression condition', () => {
    const code = 'during 1 < 2 { let x = 1 }'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(1)
    const stmt = program.body[0] as DuringStatement<InfixExpression>
    expect(stmt.type).toBe('DuringStatement')
    expect(stmt.condition.type).toBe('InfixExpression')
    expect(stmt.body.type).toBe('BlockStatement')
    expect(stmt.body.statements.length).toBe(1)
  })

  it('throws error on during statement with non-boolean condition', () => {
    const code = 'during 123 { let x = 1 }'
    const parser = new Parser(new Lexer(code, 'test'))
    expectPanic(
      () => parser.parseProgram(),
      'Expected condition expression to be of type boolean, got int'
    )
  })

  it('parses simple check statement', () => {
    const code = 'check true { let x = 1 }'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(1)
    const stmt = program.body[0] as CheckStatement<BooleanLiteral>
    expect(stmt.type).toBe('CheckStatement')
    expect(stmt.condition.type).toBe('BooleanLiteral')
    expect(stmt.condition.value).toBe(true)
    expect(stmt.body.type).toBe('BlockStatement')
    expect(stmt.body.statements.length).toBe(1)
  })

  it('parses check statement with fail block', () => {
    const code = 'check true { let x = 1 } fail { let y = 2 }'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(1)
    const stmt = program.body[0] as CheckStatement<BooleanLiteral>
    expect(stmt.type).toBe('CheckStatement')
    expect(stmt.condition.type).toBe('BooleanLiteral')
    expect(stmt.condition.value).toBe(true)
    expect(stmt.body.type).toBe('BlockStatement')
    expect(stmt.body.statements.length).toBe(1)
    expect(stmt.fail?.type).toBe('BlockStatement')
    expect(stmt.fail?.statements.length).toBe(1)
  })

  it('parses check statement with infix expression condition', () => {
    const code = 'check 1 < 2 { let x = 1 }'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    expect(program.body.length).toBe(1)
    const stmt = program.body[0] as CheckStatement<InfixExpression>
    expect(stmt.type).toBe('CheckStatement')
    expect(stmt.condition.type).toBe('InfixExpression')
    expect(stmt.body.type).toBe('BlockStatement')
    expect(stmt.body.statements.length).toBe(1)
  })

  it('throws error on check statement with non-boolean condition', () => {
    const code = 'check 123 { let x = 1 }'
    const parser = new Parser(new Lexer(code, 'test'))
    expectPanic(
      () => parser.parseProgram(),
      'Expected condition expression to be of type boolean, got int'
    )
  })
})
