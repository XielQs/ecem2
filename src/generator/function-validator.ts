import { parseTokenAsLiteral, CTypeToHuman } from '../parser/parse-helpers.ts'
import type { CType, Expression } from '../parser/index.ts'
import type { Token } from '../parser/token.ts'
import type Parser from '../parser/parser.ts'

export interface FunctionArg {
  type: CType[]
  optional?: boolean
  variadic?: boolean
  name?: string
}

export default class FunctionValidator {
  static validateCall(
    name: string,
    args: Expression[],
    expected: FunctionArg[],
    parser: Parser,
    token: Token
  ): void {
    const isVariadic = expected.at(-1)?.variadic ?? false
    const requiredArgs = expected.filter(arg => !arg.optional).length

    if (args.length < requiredArgs) {
      parser.throwError(
        token,
        `${name} expects at least ${requiredArgs} argument(s), got ${args.length}`
      )
    }

    if (!isVariadic && args.length > expected.length) {
      parser.throwError(
        token,
        `${name} expects at most ${expected.length} argument(s), got ${args.length}`
      )
    }

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      const actualType = arg.cType
      const expectedArg = expected[i] ?? expected[expected.length - 1]
      const expectedTypes = expectedArg.type

      if (!expectedTypes.includes(actualType)) {
        const lit = (parseTokenAsLiteral(arg.token) ?? arg.token.literal).toString()
        const argName = expectedArg.name ?? i + 1
        parser.throwError(
          {
            column: token.column - lit.length - arg.token.literal.length + 1,
            line: token.line,
            literal: lit,
            type: token.type
          },
          `Argument ${argName} of ${name} must be ${expectedTypes
            .map(CTypeToHuman)
            .join(' or ')}, got ${CTypeToHuman(actualType)}`
        )
      }
    }
  }
}
