import FunctionValidator, { type FunctionArg } from './function-validator.ts'
import type { CType, Expression } from '../parser/index.ts'
import { STDModule } from './modules.ts'
import Parser from '../parser/index.ts'

interface FunctionDefinition {
  name: string
  returnType: CType
  args: FunctionArg[]
  module: STDModule
}

export default class Functions {
  private static functions = new Map<string, FunctionDefinition>()

  static register(fn: FunctionDefinition) {
    this.functions.set(fn.name, fn)
  }

  static get(name: string): FunctionDefinition | undefined {
    return this.functions.get(name)
  }

  static has(name: string): boolean {
    return this.functions.has(name)
  }

  static validateCall(
    name: string,
    args: Expression[],
    parser: Parser
  ): FunctionDefinition | never {
    const fn = this.functions.get(name)
    if (!fn) parser.throwError(parser.cur, `${name} is not a function`)

    FunctionValidator.validateCall(name, args, fn.args, parser, parser.cur)

    return fn
  }
}

// === IO ===

Functions.register({
  name: 'print',
  returnType: 'VoidLiteral',
  args: [{ type: ['StringLiteral', 'BooleanLiteral', 'IntegerLiteral'], variadic: true }],
  module: STDModule.IO
})

Functions.register({
  name: 'input',
  returnType: 'StringLiteral',
  args: [{ type: ['StringLiteral'], optional: true }],
  module: STDModule.IO
})

// === STRING ===

Functions.register({
  name: 'to_string',
  returnType: 'StringLiteral',
  args: [{ type: ['IntegerLiteral', 'BooleanLiteral'] }],
  module: STDModule.STRING
})

Functions.register({
  name: 'starts_with',
  returnType: 'BooleanLiteral',
  args: [{ type: ['StringLiteral'] }, { type: ['StringLiteral'] }],
  module: STDModule.STRING
})

Functions.register({
  name: 'ends_with',
  returnType: 'BooleanLiteral',
  args: [{ type: ['StringLiteral'] }, { type: ['StringLiteral'] }],
  module: STDModule.STRING
})

Functions.register({
  name: 'contains',
  returnType: 'BooleanLiteral',
  args: [{ type: ['StringLiteral'] }, { type: ['StringLiteral'] }],
  module: STDModule.STRING
})

// === MATH ===

Functions.register({
  name: 'sqrt',
  returnType: 'IntegerLiteral',
  args: [{ type: ['IntegerLiteral'] }],
  module: STDModule.MATH
})

Functions.register({
  name: 'pow',
  returnType: 'IntegerLiteral',
  args: [{ type: ['IntegerLiteral'] }, { type: ['IntegerLiteral'] }],
  module: STDModule.MATH
})

Functions.register({
  name: 'max',
  returnType: 'IntegerLiteral',
  args: [{ type: ['IntegerLiteral'], variadic: true }],
  module: STDModule.MATH
})

Functions.register({
  name: 'min',
  returnType: 'IntegerLiteral',
  args: [{ type: ['IntegerLiteral'], variadic: true }],
  module: STDModule.MATH
})
