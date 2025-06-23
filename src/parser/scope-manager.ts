import type { Expression } from './index.ts'
import type { Token } from './token.ts'

interface IdentifierInfo {
  expression: Expression
  referenced: boolean
  declaredAt: Token
}

export default class ScopeManager {
  private scopes = [new Map<string, IdentifierInfo>()]

  enterScope(): void {
    this.scopes.push(new Map())
  }

  exitScope(): void {
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
}
