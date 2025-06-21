import type { CType } from '../parser/index.ts'

interface LiteralProperty {
  name: string
  returnType: CType
}

type PropertyMap = Map<string, LiteralProperty>

export default class LiteralProperties {
  private static properties: Map<CType, PropertyMap> = new Map()

  static register(literalType: CType, property: LiteralProperty) {
    if (!this.properties.has(literalType)) {
      this.properties.set(literalType, new Map())
    }
    this.properties.get(literalType)!.set(property.name, property)
  }

  static get(literalType: CType, name: string): LiteralProperty | undefined {
    return this.properties.get(literalType)?.get(name)
  }

  static has(literalType: CType, name: string): boolean {
    return this.properties.get(literalType)?.has(name) ?? false
  }
}

LiteralProperties.register('StringLiteral', {
  name: 'len', // kagamine len mentioned??
  returnType: 'IntegerLiteral'
})
