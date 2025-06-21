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
  ImportStatement,
  MethodCallExpression,
  MemberExpression
} from '../parser/index.ts'
import { parseBoolean, parseIdentifier, parseInteger, parseString } from '../parser/index.ts'
import LiteralProperties from './literalProperties.ts'
import LiteralMethods from './literalMethods.ts'
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
    interface TypeMap {
      Program: Program
      Identifier: Identifier
      IntegerLiteral: IntegerLiteral
      StringLiteral: StringLiteral
      BooleanLiteral: BooleanLiteral
      VoidLiteral: VoidLiteral
      LetStatement: LetStatement
      AssignmentStatement: AssignmentStatement
      ExpressionStatement: ExpressionStatement
      ImportStatement: ImportStatement
      InfixExpression: InfixExpression
      CallExpression: CallExpression
      MethodCallExpression: MethodCallExpression
      MemberExpression: MemberExpression
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
      AssignmentStatement: this.visitAssignmentStatement,
      ExpressionStatement: this.visitExpressionStatement,
      ImportStatement: this.visitImportStatement,
      InfixExpression: this.visitInfixExpression,
      CallExpression: this.visitCallExpression,
      MethodCallExpression: this.visitMethodCallExpression,
      MemberExpression: this.visitMemberExpression
    }
    const visitFn = typeMap[node.type] as (node: TypeMap[keyof TypeMap]) => void
    if (visitFn) visitFn.bind(this, node)()
    else throw new Error(`No visit method for node type: ${node.type}`)
  }

  private addHeader(header: string): void {
    if (!this.headers.has(header)) this.headers.add(header)
  }

  private insertSemi(): void {
    if (this.out.endsWith(';')) return
    if (this.out.endsWith('\n')) {
      if (this.out.at(-2) === ';') return
      this.out = this.out.slice(0, -1) // remove the last newline
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
      case 'MethodCallExpression':
        const method = LiteralMethods.get(
          expression.callee.object.cType,
          expression.callee.property.value
        )
        if (!method) {
          throw new Error(
            `${expression.callee.property.value} is not a method of ${CTypeToCode(
              expression.callee.object.cType
            )}`
          )
        }
        return CTypeToCode(method.returnType)
      case 'MemberExpression':
        const property = LiteralProperties.get(expression.object.cType, expression.property.value)
        if (!property) {
          throw new Error(
            `${expression.property.value} is not a property of ${CTypeToCode(
              expression.object.cType
            )}`
          )
        }
        return CTypeToCode(property.returnType)
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

  private visitMethodCallExpression(node: MethodCallExpression): void {
    const methodName = node.callee.property.value
    const literalType = node.callee.object.cType
    if (!literalType) {
      throw new Error(`Cannot determine type for object: ${node.callee.object.type}`)
    }

    if (!LiteralMethods.has(literalType, methodName)) {
      throw new Error(`${methodName} is not a method of ${literalType}`)
    }

    this.addHeader(`<ecem2/${literalType}/methods/${methodName}.hpp>`)

    this.out += `ecem2::${literalType}::${methodName}(`
    this.visit(node.callee.object)

    for (let i = 0; i < node.args.length; i++) {
      this.visit(node.args[i])
      if (i < node.args.length - 1) {
        this.out += ', '
      }
    }
    this.out += ')'
  }

  private visitMemberExpression(node: MemberExpression): void {
    const propertyName = node.property.value
    const literalType = node.object.cType
    if (!literalType) {
      throw new Error(`Cannot determine type for property: ${node.property.type}`)
    }

    if (!LiteralProperties.has(literalType, propertyName)) {
      throw new Error(`${propertyName} is not a property of ${literalType}`)
    }

    this.addHeader(`<ecem2/${literalType}/properties/${propertyName}.hpp>`)

    this.out += `ecem2::${literalType}::${propertyName}(`
    this.visit(node.object)
    this.out += ')'
  }
}
