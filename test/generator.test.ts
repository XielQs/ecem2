import LiteralMethods from '../src/generator/literal-methods.ts'
import CodeGenerator from '../src/generator/generator.ts'
import { STDModule } from '../src/generator/modules.ts'
import Functions from '../src/generator/functions.ts'
import { describe, it, expect } from 'bun:test'
import Parser from '../src/parser/parser.ts'
import Lexer from '../src/lexer.ts'

const enum TESTModule {
  TEST = 'test'
}

// @ts-expect-error - hide STDModule.TEST from type checking
STDModule.TEST = TESTModule.TEST

describe('CodeGenerator', () => {
  it('generates code for simple let statement', () => {
    const code = 'let x = 42'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const generator = new CodeGenerator(parser)
    const generatedCode = generator.generate(program)
    expect(generatedCode).toContain('int x = 42')
  })

  it('generates code for string literal', () => {
    const code = 'let message = "hello"'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const generator = new CodeGenerator(parser)
    const generatedCode = generator.generate(program)
    expect(generatedCode).toContain('std::string message = std::string("hello")')
  })

  it('generates code for infix expression', () => {
    const code = 'let result = 3 + 4'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const generator = new CodeGenerator(parser)
    const generatedCode = generator.generate(program)
    expect(generatedCode).toContain('int result = (3 + 4)')
  })

  it('generates code for function call', () => {
    Functions.register({
      name: 'testFn',
      args: [],
      returnType: 'IntegerLiteral',
      module: TESTModule.TEST as unknown as STDModule
    })
    const code = 'import <test>\nlet value = testFn()'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const generator = new CodeGenerator(parser)
    const generatedCode = generator.generate(program)
    expect(generatedCode).toContain('int value = ecem2::testFn()')
  })

  it('generates code for method call', () => {
    LiteralMethods.register('StringLiteral', {
      name: 'testMethod',
      args: [],
      returnType: 'StringLiteral'
    })
    const code = 'let message = "hello".testMethod()'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const generator = new CodeGenerator(parser)
    const generatedCode = generator.generate(program)
    expect(generatedCode).toContain(
      'std::string message = ecem2::StringLiteral::testMethod(std::string("hello"))'
    )
  })

  it('generates code for property expression', () => {
    const code = 'let len = "hello".len'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const generator = new CodeGenerator(parser)
    const generatedCode = generator.generate(program)
    expect(generatedCode).toContain('int len = ecem2::StringLiteral::len(std::string("hello"))')
  })

  it('generates code for nested function and method calls', () => {
    Functions.register({
      name: 'process',
      args: [{ type: ['StringLiteral'] }],
      returnType: 'IntegerLiteral',
      module: TESTModule.TEST as unknown as STDModule
    })
    LiteralMethods.register('StringLiteral', {
      name: 'upper',
      args: [],
      returnType: 'StringLiteral'
    })
    const code = 'import <test>\nlet result = process("hello".upper())'
    const parser = new Parser(new Lexer(code, 'test'))
    const program = parser.parseProgram()
    const generator = new CodeGenerator(parser)
    const generatedCode = generator.generate(program)
    expect(generatedCode).toContain(
      'int result = ecem2::process(ecem2::StringLiteral::upper(std::string("hello")))'
    )
  })
})
