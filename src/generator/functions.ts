import type { CType } from '../parser/ast.ts'
import { cTypeToHumanReadable } from '../parser/index.ts'

type FunctionDefinition = {
  name: string
  returnType: CType
  args: {
    type: CType[]
    variadic?: boolean
  }[]
}

export default class Functions {
  private static functions: Map<string, FunctionDefinition> = new Map()

  static register(fn: FunctionDefinition) {
    this.functions.set(fn.name, fn)
  }

  static get(name: string): FunctionDefinition | undefined {
    return this.functions.get(name)
  }

  static has(name: string): boolean {
    return this.functions.has(name)
  }

  static validateCall(name: string, args: CType[]): true | string {
    const fn = this.functions.get(name)
    if (!fn) return `Function ${name} is not defined`

    const expected = fn.args

    const isVariadic = expected.at(-1)?.variadic

    if (!isVariadic && args.length !== expected.length) {
      return `Function ${name} expects ${expected.length} arguments, got ${args.length}`
    }

    for (let i = 0; i < args.length; i++) {
      const expectedType = expected[i]?.type || (isVariadic ? expected.at(-1)?.type : null)
      if (!expectedType || !expectedType.includes(args[i])) {
        return `Argument ${i + 1} of function ${name} must be ${expectedType
          .map(cTypeToHumanReadable)
          .join(' or ')}, got ${cTypeToHumanReadable(args[i])}`
      }
    }

    return true
  }
}

Functions.register({
  name: 'print',
  returnType: 'VoidLiteral',
  args: [{ type: ['StringLiteral'], variadic: true }]
})
