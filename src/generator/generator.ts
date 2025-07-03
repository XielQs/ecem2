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
  PropertyExpression,
  BlockStatement,
  CheckStatement,
  DuringStatement,
  PrefixExpression,
  FunctionStatement,
  ReturnStatement
} from '../parser/index.ts'
import { parseBoolean, parseIdentifier, parseInteger, parseString } from '../parser/index.ts'
import LiteralProperties from './literal-properties.ts'
import { CTypeToCode, type CodeType } from './index.ts'
import LiteralMethods from './literal-methods.ts'
import type Parser from '../parser/index.ts'
import { randomBytes } from 'node:crypto'
import Functions from './functions.ts'

export default class CodeGenerator {
  private out = ''
  private readonly parser: Parser
  private headers = new Set<string>()
  private indentLevel = 1

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

  private indent(): void {
    this.out += '    '.repeat(this.indentLevel)
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
      BlockStatement: BlockStatement
      CheckStatement: CheckStatement
      DuringStatement: DuringStatement
      FunctionStatement: FunctionStatement
      ReturnStatement: ReturnStatement
      InfixExpression: InfixExpression
      CallExpression: CallExpression
      PropertyExpression: PropertyExpression
      MethodCallExpression: MethodCallExpression
      PrefixExpression: PrefixExpression
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
      BlockStatement: this.visitBlockStatement,
      CheckStatement: this.visitCheckStatement,
      DuringStatement: this.visitDuringStatement,
      FunctionStatement: this.visitFunctionStatement,
      ReturnStatement: this.visitReturnStatement,
      InfixExpression: this.visitInfixExpression,
      CallExpression: this.visitCallExpression,
      PropertyExpression: this.visitPropertyExpression,
      MethodCallExpression: this.visitMethodCallExpression,
      PrefixExpression: this.visitPrefixExpression
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
      if (!['ImportStatement', 'FunctionStatement'].includes(stmt.type)) this.indent()
      this.visit(stmt)
    }
    this.indent()
    this.out += 'return 0;\n'
    this.out += '}\n'
  }

  private parseExpressionType(expression: Expression): CodeType | null {
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
        const identifierInfo = this.parser.scopes.identifiers.resolve(expression.value)
        if (!identifierInfo) {
          throw new Error(`Identifier ${expression.value} is not defined`)
        }
        return this.parseExpressionType(identifierInfo.expression)
      case 'InfixExpression':
        return CTypeToCode(expression.cType)
      case 'CallExpression': {
        const func =
          (expression.isLocal &&
            this.parser.scopes.functions.resolve(expression.callee.value)?.statement) ||
          Functions.get(expression.callee.value)
        if (!func) {
          throw new Error(`Function ${expression.callee.value} is not defined`)
        }
        return CTypeToCode(func.returnType)
      }
      case 'MethodCallExpression': {
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
      }
      case 'PropertyExpression': {
        const property = LiteralProperties.get(expression.object.cType, expression.property.value)
        if (!property) {
          throw new Error(
            `${expression.property.value} is not a property of ${CTypeToCode(
              expression.object.cType
            )}`
          )
        }
        return CTypeToCode(property.returnType)
      }
      case 'PrefixExpression': {
        const rightType = this.parseExpressionType(expression.right)
        if (!rightType) {
          throw new Error(`Cannot determine type for right operand in prefix expression`)
        }
        return rightType
      }
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
    const func =
      (node.isLocal && this.parser.scopes.functions.resolve(funcName)) || Functions.get(funcName)
    if (!func) {
      throw new Error(`Function ${funcName} is not defined`)
    }

    if (!node.isLocal) this.out += `ecem2::`
    this.out += `${funcName}(`
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

  private visitPropertyExpression(node: PropertyExpression): void {
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

  private visitBlockStatement(node: BlockStatement): void {
    this.out += '{\n'
    this.indentLevel++
    for (const stmt of node.statements) {
      if (stmt.type !== 'ImportStatement') {
        this.indent()
      }
      this.visit(stmt)
    }
    this.indentLevel--
    if (
      node.statements.length > 0 &&
      node.statements[node.statements.length - 1].type !== 'ImportStatement'
    ) {
      this.indent()
    }
    this.out += '}\n'
  }

  private visitCheckStatement(node: CheckStatement): void {
    this.out += 'if ('
    this.visit(node.condition)
    this.out += ') '
    this.visit(node.body)

    if (node.failCheck ?? node.fail) {
      // remove newline before else
      this.out = this.out.trimEnd()
      this.out += ' else '
      this.visit((node.failCheck ?? node.fail)!)
    }
  }

  private visitDuringStatement(node: DuringStatement): void {
    const failVarName = `fail_${randomBytes(8).toString('hex')}`
    if (node.fail) {
      this.out += `bool ${failVarName} = false;\n    `
      node.body.statements.unshift({
        type: 'ExpressionStatement',
        expression: {
          type: 'AssignmentStatement',
          name: {
            type: 'Identifier',
            value: failVarName,
            cType: 'BooleanLiteral',
            token: node.token
          },
          value: {
            type: 'BooleanLiteral',
            value: true,
            cType: 'BooleanLiteral',
            token: node.token
          }
        },
        token: node.token,
        cType: 'BooleanLiteral'
      } satisfies ExpressionStatement)
    }
    this.out += 'while ('
    this.visit(node.condition)
    this.out += ') '
    this.visit(node.body)
    if (node.fail) {
      this.indent()
      this.out += `if (!${failVarName}) `
      this.visit(node.fail)
    }
  }

  private visitPrefixExpression(node: PrefixExpression): void {
    if (node.operator !== '!') {
      throw new Error(`Unsupported prefix operator: ${node.operator}`)
    }

    switch (node.right.cType) {
      case 'BooleanLiteral':
      case 'IntegerLiteral':
        this.out += '!('
        this.visit(node.right)
        this.out += ')'
        break
      case 'StringLiteral':
        this.out += '('
        this.visit(node.right)
        this.out += ').empty()'
        break
      default:
        throw new Error(`Cannot use ! operator on ${CTypeToCode(node.right.cType)}`)
    }
  }

  private visitFunctionStatement(node: FunctionStatement): void {
    const content = this.out
    this.out = `${CTypeToCode(node.name.cType)} ${node.name.value}(`
    this.out += node.args.map(arg => `${CTypeToCode(arg.cType)} ${arg.value}`).join(', ')
    this.out += ') {\n'

    for (const stmt of node.body.statements) {
      this.indent()
      this.visit(stmt)
    }

    this.out += `}\n\n`
    this.out += content
  }

  private visitReturnStatement(node: ReturnStatement): void {
    this.out += 'return '
    if (node.value.type === 'VoidLiteral') {
      this.out += 'void()'
    } else this.visit(node.value)
    this.insertSemi()
  }
}
