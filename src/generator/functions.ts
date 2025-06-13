import Parser, { CTypeToHuman, parseTokenAsLiteral } from '../parser/index.ts'
import type { CType, Expression } from '../parser/index.ts'

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

  static validateCall(name: string, args: Expression[], parser: Parser): void {
    const fn = this.functions.get(name)
    if (!fn) return parser.throwError(parser.cur, `${name} is not defined`)

    const argTypes = args.map(arg => arg.cType)
    const expected = fn.args

    const isVariadic = expected.at(-1)?.variadic

    if (!isVariadic && args.length !== expected.length) {
      return parser.throwError(
        parser.cur,
        `${name} expects ${expected.length} argument(s), got ${args.length}`
      )
    }

    for (let i = 0; i < args.length; i++) {
      const expectedType = expected[i]?.type || (isVariadic ? expected.at(-1)?.type : null)
      if (!expectedType || !expectedType.includes(argTypes[i])) {
        const literal = (parseTokenAsLiteral(args[i].token) || args[i].token.literal).toString()
        return parser.throwError(
          {
            column: parser.cur.column - literal.length - args[i].token.literal.length + 1,
            line: parser.cur.line,
            literal,
            type: parser.cur.type
          },
          `Argument ${i + 1} of ${name} must be ${expectedType
            .map(CTypeToHuman)
            .join(' or ')}, got ${CTypeToHuman(argTypes[i])}`
        )
      }
    }
  }
}

Functions.register({
  name: 'print',
  returnType: 'VoidLiteral',
  args: [{ type: ['StringLiteral'], variadic: true }]
})
