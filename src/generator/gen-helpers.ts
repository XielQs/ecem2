import type { CType } from '../parser/index.ts'

export type CodeType = 'int' | 'std::string' | 'bool' | 'void'

export function CTypeToCode(cType: CType): CodeType {
  switch (cType) {
    case 'IntegerLiteral':
      return 'int'
    case 'StringLiteral':
      return 'std::string'
    case 'BooleanLiteral':
      return 'bool'
    case 'VoidLiteral':
      return 'void'
    default:
      throw new Error(`Unknown CType: ${cType}`)
  }
}
