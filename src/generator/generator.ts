import type {
  ASTNode,
  BooleanLiteral,
  Expression,
  Identifier,
  InfixExpression,
  IntegerLiteral,
  LetStatement,
  Program,
  StringLiteral
} from '../parser/ast.ts'
import { parseBoolean, parseIdentifier, parseInteger, parseString } from '../parser/parseHelpers.ts'

export default class CodeGenerator {
  private out = ''

  public generate(node: ASTNode): string {
    this.visit(node as Exclude<ASTNode, { type: 'ExpressionStatement' }>)
    return this.out
  }

  private visit(node: Exclude<ASTNode, { type: 'ExpressionStatement' }>): void {
    type TypeMap = {
      Program: Program
      Identifier: Identifier
      IntegerLiteral: IntegerLiteral
      StringLiteral: StringLiteral
      BooleanLiteral: BooleanLiteral
      LetStatement: LetStatement
      InfixExpression: InfixExpression
    }

    const typeMap: {
      [K in keyof TypeMap]: (node: TypeMap[K]) => void
    } = {
      Program: this.visitProgram,
      Identifier: this.visitIdentifier,
      IntegerLiteral: this.visitIntegerLiteral,
      StringLiteral: this.visitStringLiteral,
      BooleanLiteral: this.visitBooleanLiteral,
      LetStatement: this.visitLetStatement,
      InfixExpression: this.visitInfixExpression
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
      if (stmt.type !== 'ExpressionStatement') this.visit(stmt)
    }
    this.out += '    return 0;\n'
    this.out += '}\n'
  }

  private parseExpressionType(expression: Expression): string {
    switch (expression.type) {
      case 'IntegerLiteral':
        return 'int'
      case 'Identifier':
      case 'StringLiteral':
        return 'char*'
      case 'BooleanLiteral':
        return 'bool'
      case 'InfixExpression':
        return this.parseExpressionType(expression.left)
    }
  }

  private visitLetStatement(node: LetStatement): void {
    this.out += this.parseExpressionType(node.value) + ' '
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

  private concatString(node: InfixExpression): string | null {
    if (node.operator !== '+') return null

    const collect = (n: ASTNode): string | null => {
      if (n.type === 'StringLiteral') {
        return n.value
      } else if (n.type === 'InfixExpression' && n.operator === '+') {
        const left = collect(n.left)
        const right = collect(n.right)
        return left !== null && right !== null ? left + right : null
      } else {
        return null
      }
    }

    return collect(node)
  }

  private visitInfixExpression(node: InfixExpression): void {
    const concated = this.concatString(node)
    if (concated !== null) {
      this.out += `"${concated}"`
      return
    }

    this.out += '('
    this.visit(node.left)
    this.out += ` ${node.operator} `
    this.visit(node.right)
    this.out += ')'
  }
}
