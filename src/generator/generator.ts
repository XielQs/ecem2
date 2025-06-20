import type {
  AssignmentStatement,
  ASTNode,
  BooleanLiteral,
  CallExpression,
  Expression,
  ExpressionStatement,
  Identifier,
  InfixExpression,
  IntegerLiteral,
  LetStatement,
  VoidLiteral,
  Program,
  StringLiteral,
  ImportStatement
} from '../parser/index.ts'
import { parseBoolean, parseIdentifier, parseInteger, parseString } from '../parser/index.ts'
import type Parser from '../parser/index.ts'
import { CTypeToCode } from './index.ts'
import Functions from './functions.ts'

export default class CodeGenerator {
  private out = ''
  private readonly parser: Parser
  private headers: Set<string> = new Set()

  constructor(parser: Parser) {
    this.parser = parser
  }

  public generate(node: ASTNode): string {
    this.visit(node)
    this.generateHeaders()
    return this.out
  }

  private generateHeaders(): void {
    const headers = [...this.headers].map(header => `#include ${header}`).join('\n')
    if (headers) {
      this.out = `${headers}\n\n` + this.out
    }
  }

  private visit(node: ASTNode): void {
    type TypeMap = {
      Program: Program
      Identifier: Identifier
      IntegerLiteral: IntegerLiteral
      StringLiteral: StringLiteral
      BooleanLiteral: BooleanLiteral
      VoidLiteral: VoidLiteral
      LetStatement: LetStatement
      InfixExpression: InfixExpression
      AssignmentStatement: AssignmentStatement
      ExpressionStatement: ExpressionStatement
      ImportStatement: ImportStatement
      CallExpression: CallExpression
    }

    const typeMap: {
      [K in keyof TypeMap]: (node: TypeMap[K]) => void
    } = {
      Program: this.visitProgram,
      Identifier: this.visitIdentifier,
      IntegerLiteral: this.visitIntegerLiteral,
      StringLiteral: this.visitStringLiteral,
      BooleanLiteral: this.visitBooleanLiteral,
      VoidLiteral: this.visitVoidLiteral,
      LetStatement: this.visitLetStatement,
      InfixExpression: this.visitInfixExpression,
      AssignmentStatement: this.visitAssignmentStatement,
      ExpressionStatement: this.visitExpressionStatement,
      ImportStatement: this.visitImportStatement,
      CallExpression: this.visitCallExpression
    }
    const visitFn = typeMap[node.type] as (node: TypeMap[keyof TypeMap]) => void
    if (visitFn) {
      visitFn.bind(this, node)()
    } else {
      throw new Error(`No visit method for node type: ${node.type}`)
    }
  }

  private addHeader(header: string): void {
    if (!this.headers.has(header)) this.headers.add(header)
  }

  private insertSemi(): void {
    if (this.out.endsWith(';')) return
    if (this.out.endsWith('\n')) {
      if (this.out.at(-2) === ';') return
      this.out = this.out.slice(0, -1) // Remove the last newline
    }
    this.out += ';\n'
  }

  private visitProgram(node: Program): void {
    this.out += 'int main() {\n'
    for (const stmt of node.body) {
      if (stmt.type !== 'ImportStatement') {
        this.out += '    '
      }
      this.visit(stmt)
    }
    this.out += '    return 0;\n'
    this.out += '}\n'
  }

  private parseExpressionType(expression: Expression): string | null {
    switch (expression.type) {
      case 'IntegerLiteral':
        return 'int'
      case 'StringLiteral':
        return 'std::string'
      case 'BooleanLiteral':
        return 'bool'
      case 'VoidLiteral':
        return 'void'
      case 'Identifier':
        return this.parseExpressionType(this.parser.identifiers[expression.value].expression)
      case 'InfixExpression':
        return this.parseExpressionType(expression.left)
      case 'CallExpression':
        const func = Functions.get(expression.callee.value)
        if (!func) {
          throw new Error(`Function ${expression.callee.value} is not defined`)
        }
        return CTypeToCode(func.returnType)
      default:
        // @ts-expect-error = this is a type guard
        throw new Error(`Unsupported expression type: ${expression.type}`)
    }
  }

  private visitLetStatement(node: LetStatement): void {
    const expType = this.parseExpressionType(node.value)
    if (!expType) {
      throw new Error(`Cannot determine type for expression: ${node.value.type}`)
    }
    this.out += expType + ' '
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
    this.out += 'std::string('
    this.out += parseString(node)
    this.out += ')'
  }

  private visitBooleanLiteral(node: BooleanLiteral): void {
    this.out += parseBoolean(node)
  }

  private visitVoidLiteral(_node: VoidLiteral): void {
    this.out += 'void'
  }

  private visitInfixExpression(node: InfixExpression): void {
    this.out += '('
    this.visit(node.left)
    this.out += ` ${node.operator} `
    this.visit(node.right)
    this.out += ')'
  }

  private visitAssignmentStatement(node: AssignmentStatement): void {
    this.visit(node.name)
    this.out += ' = '
    this.visit(node.value)
    this.insertSemi()
  }

  private visitExpressionStatement(node: ExpressionStatement): void {
    this.visit(node.expression)
    this.insertSemi()
  }

  private visitImportStatement(node: ImportStatement): void {
    this.addHeader(`<ecem2/${node.name}.hpp>`)
  }

  private visitCallExpression(node: CallExpression): void {
    if (node.callee.type !== 'Identifier') throw new Error('Unsupported callee type')
    const funcName = node.callee.value
    if (!Functions.has(funcName)) {
      throw new Error(`Function ${funcName} is not defined`)
    }

    this.out += `ecem2::${funcName}(`
    for (let i = 0; i < node.args.length; i++) {
      this.visit(node.args[i])
      if (i < node.args.length - 1) {
        this.out += ', '
      }
    }
    this.out += ')'
  }
}
