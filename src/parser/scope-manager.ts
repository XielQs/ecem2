import type { Expression, FunctionStatement } from './index.ts'
import type { Token } from './token.ts'

export interface IdentifierInfo {
  expression: Expression
  referenced: boolean
  declaredAt: Token
}

export interface FunctionInfo {
  statement: FunctionStatement
  referenced: boolean
  declaredAt: Token
}

export default class ScopeManager<T extends IdentifierInfo | FunctionInfo> {
  private scopes: Array<Map<string, T>> = []
  public readonly unuseds = new Map<string, T>()

  constructor() {
    this.enterScope() // initialize with a global scope
  }

  enterScope(): void {
    this.scopes.push(new Map<string, T>())
  }

  exitScope(): void {
    for (const [name, info] of this.currentScope.entries()) {
      if (!info.referenced) this.unuseds.set(name, info)
    }
    this.scopes.pop()
  }

  define(name: string, value: T): void {
    this.currentScope.set(name, value)
  }

  resolve(name: string): T | undefined {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const val = this.scopes[i].get(name)
      if (val) return val
    }
    return undefined
  }

  get currentScope(): Map<string, T> {
    return this.scopes[this.scopes.length - 1]
  }

  has(name: string): boolean {
    return this.resolve(name) !== undefined
  }

  hasScope(name: string): boolean {
    return this.currentScope.has(name)
  }
}
