import type {
  AssignmentStatement,
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
import type Parser from '../parser/parser.ts'

export default class CodeGenerator {
  private out = ''
  private readonly parser: Parser
  private headers: string[] = []

  constructor(parser: Parser) {
    this.parser = parser
  }

  public generate(node: ASTNode): string {
    this.visit(node as Exclude<ASTNode, { type: 'ExpressionStatement' }>)
    this.generateHeaders()
    return this.out
  }

  private generateHeaders(): void {
    const headers = this.headers.join('\n#include ')
    if (headers) {
      this.out = `#include ${headers}\n\n` + this.out
    }
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
      AssignmentStatement: AssignmentStatement
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
      InfixExpression: this.visitInfixExpression,
      AssignmentStatement: this.visitAssignmentStatement
    }
    const visitFn = typeMap[node.type] as (node: TypeMap[keyof TypeMap]) => void
    if (visitFn) {
      visitFn.bind(this, node)()
    } else {
      throw new Error(`No visit method for node type: ${node.type}`)
    }
  }

  private addHeader(header: string): void {
    if (!this.headers.includes(header)) this.headers.push(header)
  }

  private visitProgram(node: Program): void {
    this.out += 'int main() {\n'
    for (const stmt of node.body.filter(node => node.type !== 'ExpressionStatement')) {
      this.out += '    '
      this.visit(stmt)
    }
    this.out += '    return 0;\n'
    this.out += '}\n'
  }

  private parseExpressionType(expression: Expression): string {
    switch (expression.type) {
      case 'IntegerLiteral':
        return 'int'
      case 'StringLiteral':
        return 'std::string'
      case 'BooleanLiteral':
        return 'bool'
      case 'Identifier':
        return this.parseExpressionType(this.parser.identifiers[expression.value])
      case 'InfixExpression':
        return this.parseExpressionType(expression.left)
      default:
        // @ts-expect-error = this is a type guard
        throw new Error(`Unsupported expression type: ${expression.type}`)
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
    this.addHeader('<string>')
    this.out += parseString(node)
  }

  private visitBooleanLiteral(node: BooleanLiteral): void {
    this.out += parseBoolean(node)
  }

  private visitInfixExpression(node: InfixExpression): void {
    this.out += '('
    if (node.left.type === 'StringLiteral') {
      this.out += 'std::string('
    }
    this.visit(node.left)
    if (node.left.type === 'StringLiteral') {
      this.out += ')'
    }
    this.out += ` ${node.operator} `
    if (node.right.type === 'StringLiteral') {
      this.out += 'std::string('
    }
    this.visit(node.right)
    if (node.right.type === 'StringLiteral') {
      this.out += ')'
    }
    this.out += ')'
  }

  private visitAssignmentStatement(node: AssignmentStatement): void {
    this.visit(node.name)
    this.out += ' = '
    this.visit(node.value)
    this.out += ';\n'
  }
}
