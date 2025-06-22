import type { CType } from '../parser/index.ts'

export function CTypeToCode(cType: CType): string {
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
