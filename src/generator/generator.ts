import type {
  ASTNode,
  BooleanLiteral,
  Identifier,
  IntegerLiteral,
  LetStatement,
  Program,
  StringLiteral
} from '../parser/ast.ts'
import { parseBoolean, parseIdentifier, parseInteger, parseString } from '../parser/parseHelpers.ts'

export default class CodeGenerator {
  private out = ''

  public generate(node: ASTNode): string {
    this.visit(node)
    return this.out
  }

  private visit(node: ASTNode): void {
    type TypeMap = {
      Program: Program
      Identifier: Identifier
      IntegerLiteral: IntegerLiteral
      StringLiteral: StringLiteral
      BooleanLiteral: BooleanLiteral
      LetStatement: LetStatement
    }

    const typeMap: {
      [K in keyof TypeMap]: (node: TypeMap[K]) => void
    } = {
      Program: this.visitProgram,
      Identifier: this.visitIdentifier,
      IntegerLiteral: this.visitIntegerLiteral,
      StringLiteral: this.visitStringLiteral,
      BooleanLiteral: this.visitBooleanLiteral,
      LetStatement: this.visitLetStatement
    }
    const visitFn = typeMap[node.type] as (node: TypeMap[keyof TypeMap]) => void
    if (visitFn) {
      visitFn.bind(this, node)()
    } else {
      throw new Error(`No visit method for node type: ${node.type}`)
    }
  }

  private visitProgram(node: Program): void {
    this.out += '#include <stdio.h>\n'
    this.out += '#include <stdbool.h>\n\n'
    this.out += 'int main() {\n'
    for (const stmt of node.body) {
      this.out += '    '
      this.visit(stmt)
    }
    this.out += '    return 0;\n'
    this.out += '}\n'
  }

  private visitLetStatement(node: LetStatement): void {
    switch (node.value.type) {
      case 'IntegerLiteral':
        this.out += `int `
        break
      case 'StringLiteral':
        this.out += `char* `
        break
      case 'BooleanLiteral':
        this.out += `bool `
        break
    }
    this.visit(node.name)
    this.out += ' = '
    this.visit(node.value)
    this.out += ';\n'
  }

  private visitIntegerLiteral(node: IntegerLiteral): void {
    this.out += parseInteger(node)
  }

  private visitIdentifier(node: Identifier): void {
    this.out += parseIdentifier(node)
  }

  private visitStringLiteral(node: StringLiteral): void {
    this.out += parseString(node)
  }

  private visitBooleanLiteral(node: BooleanLiteral): void {
    this.out += parseBoolean(node)
  }
}
