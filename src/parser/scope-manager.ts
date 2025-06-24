import type { Expression } from './index.ts'
import type { Token } from './token.ts'

interface IdentifierInfo {
  expression: Expression
  referenced: boolean
  declaredAt: Token
}

export default class ScopeManager {
  private scopes: Array<Map<string, IdentifierInfo>> = []
  public readonly unusedIdentifiers = new Map<string, IdentifierInfo>()

  constructor() {
    this.enterScope() // initialize with a global scope
  }

  enterScope(): void {
    this.scopes.push(new Map())
  }

  exitScope(): void {
    const currentScope = this.scopes[this.scopes.length - 1]
    for (const [name, info] of currentScope.entries()) {
      if (!info.referenced) this.unusedIdentifiers.set(name, info)
    }
    this.scopes.pop()
  }

  define(name: string, value: IdentifierInfo): void {
    const current = this.scopes[this.scopes.length - 1]
    current.set(name, value)
  }

  resolve(name: string): IdentifierInfo | undefined {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const val = this.scopes[i].get(name)
      if (val) return val
    }
    return undefined
  }

  get scopeEntiries(): Map<string, IdentifierInfo> {
    return this.scopes[this.scopes.length - 1]
  }

  has(name: string): boolean {
    return this.resolve(name) !== undefined
  }

  hasScope(name: string): boolean {
    return this.scopes[this.scopes.length - 1].has(name)
  }
}
