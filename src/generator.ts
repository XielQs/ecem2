import type {
  ASTNode,
  BooleanLiteral,
  Identifier,
  IntegerLiteral,
  LetStatement,
  Program,
  StringLiteral
} from './ast.ts'

export default class CodeGenerator {
  private out = ''

  public generate(node: ASTNode): string {
    this.visit(node)
    return this.out
  }

  private visit(node: ASTNode) {
    const typeMap: Record<string, (node: any) => void> = {
      Program: this.visitProgram,
      Identifier: this.visitIdentifier,
      IntegerLiteral: this.visitIntegerLiteral,
      StringLiteral: this.visitStringLiteral,
      BooleanLiteral: this.visitBooleanLiteral,
      LetStatement: this.visitLetStatement
    }
    const visitFn = typeMap[node.type]
    if (visitFn) {
      visitFn.call(this, node)
    } else {
      throw new Error(`No visit method for node type: ${node.type}`)
    }
  }

  private visitProgram(node: Program) {
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

  private visitLetStatement(node: LetStatement) {
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

  private visitIntegerLiteral(node: IntegerLiteral) {
    this.out += node.value
  }

  private visitIdentifier(node: Identifier) {
    this.out += node.value
  }

  private visitStringLiteral(node: StringLiteral) {
    this.out += `"${node.value}"`
  }

  private visitBooleanLiteral(node: BooleanLiteral) {
    this.out += node.value ? 'true' : 'false'
  }
}
