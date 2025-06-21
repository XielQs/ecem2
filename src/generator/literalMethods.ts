import { CTypeToHuman, type CType, type Expression } from '../parser/index.ts'
import FunctionValidator, { type FunctionArg } from './function-validator.ts'
import type Parser from '../parser/parser.ts'

interface LiteralMethod {
  name: string
  returnType: CType
  args: FunctionArg[]
}

type MethodMap = Map<string, LiteralMethod>

export default class LiteralMethods {
  private static methods: Map<CType, MethodMap> = new Map()

  static register(literalType: CType, method: LiteralMethod) {
    if (!this.methods.has(literalType)) {
      this.methods.set(literalType, new Map())
    }
    this.methods.get(literalType)!.set(method.name, method)
  }

  static get(literalType: CType, name: string): LiteralMethod | undefined {
    return this.methods.get(literalType)?.get(name)
  }

  static has(literalType: CType, name: string): boolean {
    return this.methods.get(literalType)?.has(name) ?? false
  }

  static validateCall(
    literalType: CType,
    name: string,
    args: Expression[],
    parser: Parser
  ): LiteralMethod | never {
    const method = this.get(literalType, name)
    if (!method) {
      return parser.throwError(
        parser.cur,
        `${name} is not a method of ${CTypeToHuman(literalType)}`
      )
    }

    FunctionValidator.validateCall(name, args, method.args, parser, parser.cur)

    return method
  }
}

LiteralMethods.register('StringLiteral', {
  name: 'upper',
  returnType: 'StringLiteral',
  args: []
})

LiteralMethods.register('StringLiteral', {
  name: 'lower',
  returnType: 'StringLiteral',
  args: []
})
